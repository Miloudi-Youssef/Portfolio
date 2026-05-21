package com.cinephile.data.repository

import com.cinephile.data.local.MovieDao
import com.cinephile.data.model.Genre
import com.cinephile.data.model.Movie
import com.cinephile.data.remote.TmdbApi
import com.cinephile.data.remote.toMovie
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext

// pagination wrapper returned by search operations
data class SearchResult(val movies: List<Movie>, val totalPages: Int)

// single source of truth for movie data — network first, Room cache fallback
class MovieRepository(
    private val movieDao: MovieDao,
    private val api: TmdbApi
) {

    // search movies — routes to discover (actor/director filter) or search/movie (text query)
    suspend fun searchMovies(
        query: String,
        year: Int? = null,
        genreId: Int? = null,
        actorName: String? = null,
        directorName: String? = null,
        page: Int = 1
    ): SearchResult = withContext(Dispatchers.IO) {
        if (!actorName.isNullOrBlank() || !directorName.isNullOrBlank()) {
            // actor/director filter — resolve names to TMDB person IDs first
            val castId = if (!actorName.isNullOrBlank()) {
                api.searchPerson(actorName).results.firstOrNull()?.id?.toString()
            } else null

            val crewId = if (!directorName.isNullOrBlank()) {
                api.searchPerson(directorName).results.firstOrNull()?.id?.toString()
            } else null

            // discover endpoint supports person-id filtering
            val resp = api.discoverMovies(
                genreId = genreId,
                castId  = castId,
                crewId  = crewId,
                year    = year,
                page    = page
            )
            SearchResult(resp.results.map { it.toMovie() }, resp.totalPages)
        } else {
            // standard text search via search/movie
            val resp = api.searchMovies(
                query   = query,
                year    = year,
                genreId = genreId,
                page    = page
            )
            SearchResult(resp.results.map { it.toMovie() }, resp.totalPages)
        }
    }

    // discover movies by genre — used for recommendation candidate pool
    suspend fun discoverMovies(genreId: Int? = null, page: Int = 1): List<Movie> =
        withContext(Dispatchers.IO) {
            api.discoverMovies(genreId = genreId, page = page).results.map { it.toMovie() }
        }

    // load movie details — network first, preserves local favorites/rating, falls back to cache
    fun getMovieDetails(id: Int): Flow<Movie> = flow {
        try {
            val dto     = api.getMovieDetails(id)
            val credits = runCatching { api.getMovieCredits(id) }.getOrNull()
            val network = dto.toMovie(credits)

            // preserve user's favorites flag and rating when refreshing from network
            val existing = movieDao.getMovieById(id).firstOrNull()
            val toSave = if (existing != null) {
                network.copy(isFavorite = existing.isFavorite, userRating = existing.userRating)
            } else {
                network
            }
            movieDao.upsert(toSave)
        } catch (_: Exception) { /* serve from cache if present */ }

        // always emit from Room so UI reacts to future local changes (rating, favorite)
        emitAll(movieDao.getMovieById(id).filterNotNull())
    }.flowOn(Dispatchers.IO)

    // upsert a movie — called when adding a search result to a watchlist before it has a detail record
    suspend fun upsertMovie(movie: Movie) = movieDao.upsert(movie)

    // toggle favorites flag — also synced to the Favorites watchlist by the caller
    suspend fun toggleFavorite(movieId: Int) {
        val current = movieDao.getMovieById(movieId).firstOrNull() ?: return
        movieDao.updateFavorite(movieId, !current.isFavorite)
    }

    // rating — persist the star rating chosen by the user
    suspend fun setRating(movieId: Int, rating: Float) = movieDao.updateRating(movieId, rating)

    // favorites flow — used to build the recommendation profile
    fun getFavorites(): Flow<List<Movie>> = movieDao.getFavorites()

    // rated movies flow — used alongside favorites for recommendation scoring
    fun getRatedMovies(): Flow<List<Movie>> = movieDao.getRatedMovies()

    // genre list — fetched from TMDB to populate the search filter spinner
    suspend fun getGenreList(): List<Genre> =
        api.getGenreList().genres.map { Genre(it.id, it.name) }
}

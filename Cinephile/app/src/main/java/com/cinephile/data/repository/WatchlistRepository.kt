package com.cinephile.data.repository

import com.cinephile.data.local.WatchlistDao
import com.cinephile.data.local.WatchlistMovieCount
import com.cinephile.data.model.Movie
import com.cinephile.data.model.Watchlist
import com.cinephile.data.model.WatchlistMovieCrossRef
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull

// repository for watchlist management — wraps the DAO and handles boot-time defaults
class WatchlistRepository(private val dao: WatchlistDao) {

    // all watchlists live Flow — Favorites first, then by id
    fun getAllWatchlists(): Flow<List<Watchlist>> = dao.getAllWatchlists()

    // currently-active watchlist — used for long-press add-to-watchlist in search
    fun getCurrentWatchlist(): Flow<Watchlist?> = dao.getCurrentWatchlist()

    // atomically switch the active watchlist
    suspend fun setCurrentWatchlist(id: Long) = dao.setCurrentWatchlist(id)

    // create a new watchlist — returns the generated id
    suspend fun insert(watchlist: Watchlist): Long = dao.insert(watchlist)

    // rename a watchlist — caller must guard against renaming the Favorites watchlist
    suspend fun rename(id: Long, name: String) = dao.rename(id, name)

    // delete a watchlist — caller guards against deleting the Favorites watchlist
    suspend fun delete(watchlist: Watchlist) = dao.delete(watchlist)

    // add a movie to a watchlist via cross-ref; IGNORE strategy prevents duplicates
    suspend fun addMovieToWatchlist(crossRef: WatchlistMovieCrossRef) =
        dao.addMovieToWatchlist(crossRef)

    // remove a movie from a specific watchlist
    suspend fun removeMovieFromWatchlist(watchlistId: Long, movieId: Int) =
        dao.removeMovieFromWatchlist(watchlistId, movieId)

    // movies in a watchlist — drives the watchlist detail screen
    fun getMoviesForWatchlist(watchlistId: Long): Flow<List<Movie>> =
        dao.getMoviesForWatchlist(watchlistId)

    // movie counts per watchlist — drives the count badge on each watchlist card
    fun getMovieCounts(): Flow<List<WatchlistMovieCount>> = dao.getMovieCounts()

    // reverse lookup — which watchlists contain this movie (for "Add / Remove" button state)
    fun getWatchlistsContainingMovie(movieId: Int): Flow<List<Watchlist>> =
        dao.getWatchlistsContainingMovie(movieId)

    // favorites watchlist as a live Flow — used to observe changes
    fun getFavoritesWatchlist(): Flow<Watchlist?> = dao.getFavoritesWatchlistFlow()

    // favorites watchlist — one-shot suspend read used inside toggleFavorite
    suspend fun getFavoritesWatchlistOnce(): Watchlist? = dao.getFavoritesWatchlist()

    // ensureDefaultWatchlist — called at app start; creates Favorites if missing and sets a current watchlist
    suspend fun ensureDefaultWatchlist() {
        val existing = dao.getAllWatchlists().firstOrNull() ?: emptyList()
        // favorites watchlist — create once, never delete
        val hasFavorites = existing.any { it.isFavorites }
        if (!hasFavorites) {
            dao.insert(Watchlist(name = "Favorites", isCurrent = existing.isEmpty(), isFavorites = true))
        }
        // make sure at least one watchlist is marked current
        val updated = dao.getAllWatchlists().firstOrNull() ?: emptyList()
        if (updated.none { it.isCurrent } && updated.isNotEmpty()) {
            dao.setCurrentWatchlist(updated.first().id)
        }
    }
}

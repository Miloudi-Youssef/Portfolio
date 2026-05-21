package com.cinephile.ui.recommendation

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.cinephile.data.local.CinephileDatabase
import com.cinephile.data.model.Movie
import com.cinephile.data.remote.RetrofitClient
import com.cinephile.data.repository.MovieRepository
import com.cinephile.data.repository.WatchlistRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch

// ViewModel for the recommendation screen — profile-based scoring with genre chip override
class RecommendationViewModel(
    private val movieRepo: MovieRepository,
    private val watchlistRepo: WatchlistRepository
) : ViewModel() {

    private val _recommendations = MutableStateFlow<List<Movie>>(emptyList())
    val recommendations: StateFlow<List<Movie>> = _recommendations.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // null = not yet determined, true = has results, false = truly empty (network failure)
    private val _hasData = MutableStateFlow<Boolean?>(null)
    val hasData: StateFlow<Boolean?> = _hasData.asStateFlow()

    // true = scored from user profile, false = falling back to trending/popular
    private val _isPersonalized = MutableStateFlow(true)
    val isPersonalized: StateFlow<Boolean> = _isPersonalized.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    // genre override from chip filter — overrides the top profile genre when set
    private var genreOverride: Int? = null

    init { loadRecommendations() }

    // setGenreFilter — update chip selection and reload recommendations
    fun setGenreFilter(genreId: Int?) {
        genreOverride = genreId
        loadRecommendations()
    }

    // loadRecommendations — build user profile, score candidates, fall back to trending if no profile
    fun loadRecommendations() {
        viewModelScope.launch {
            _isLoading.value = true

            // user profile — favorites + highly-rated movies (≥4 stars)
            val favorites   = movieRepo.getFavorites().firstOrNull() ?: emptyList()
            val ratedMovies = movieRepo.getRatedMovies().firstOrNull() ?: emptyList()
            val highlyRated = ratedMovies.filter { it.userRating >= 4f }
            val profileMovies = (favorites + highlyRated).distinctBy { it.id }

            if (profileMovies.isEmpty()) {
                // no profile yet — show trending/popular movies so the screen is never empty
                val trending = mutableListOf<Movie>()
                for (page in 1..2) {
                    try {
                        val batch = movieRepo.discoverMovies(genreId = genreOverride, page = page)
                        trending.addAll(batch)
                        if (batch.isEmpty()) break
                    } catch (_: Exception) {
                        if (page == 1) {
                            _error.value = "Could not load movies. Check your connection."
                            _isLoading.value = false
                            return@launch
                        }
                        break
                    }
                }
                _recommendations.value = trending.distinctBy { it.id }.take(20)
                _isPersonalized.value = false
                _hasData.value = trending.isNotEmpty()
                _isLoading.value = false
                return@launch
            }

            // build scoring signals from the user's profile
            val genreFreq     = profileMovies.flatMap { it.genres }.groupingBy { it.id }.eachCount()
            val actorIds      = favorites.flatMap { it.cast }.map { it.id }.toSet()
            val directorNames = favorites.mapNotNull { it.director }.toSet()
            val topGenreId    = genreFreq.maxByOrNull { it.value }?.key
            val effectiveGenreId = genreOverride ?: topGenreId

            // 3 pages for a richer scoring pool
            val candidates = mutableListOf<Movie>()
            var fetchFailed = false
            for (page in 1..3) {
                try {
                    val batch = movieRepo.discoverMovies(genreId = effectiveGenreId, page = page)
                    candidates.addAll(batch)
                    if (batch.isEmpty()) break
                } catch (_: Exception) {
                    if (page == 1) fetchFailed = true
                    break
                }
            }

            if (fetchFailed) {
                _error.value = "Could not load recommendations. Check your connection."
                _isLoading.value = false
                return@launch
            }

            // exclude movies already in any watchlist or already rated by the user
            val watchlists = watchlistRepo.getAllWatchlists().firstOrNull() ?: emptyList()
            val watchlistMovieIds = watchlists.flatMap { wl ->
                watchlistRepo.getMoviesForWatchlist(wl.id).firstOrNull() ?: emptyList()
            }.map { it.id }.toSet()
            val excludedIds = watchlistMovieIds + ratedMovies.map { it.id }.toSet()

            // avgRating multiplier — scales the score up for users who rate highly
            val avgRating = profileMovies.filter { it.userRating > 0 }
                .map { it.userRating }.average()
                .takeIf { !it.isNaN() }?.toFloat() ?: 1f

            // recommendation scoring: +2 per genre match, +1 per actor match, +1 director match
            val scored = candidates
                .distinctBy { it.id }
                .filter { it.id !in excludedIds }
                .map { candidate ->
                    var score = 0f
                    score += candidate.genres.count { g ->
                        profileMovies.any { m -> m.genres.any { it.id == g.id } }
                    } * 2f
                    score += candidate.cast.count { a -> a.id in actorIds } * 1f
                    if (candidate.director != null && candidate.director in directorNames) score += 1f
                    val multiplier = if (score > 0f) avgRating else 1f
                    candidate to score * multiplier
                }
                .sortedByDescending { it.second }
                .map { it.first }
                .take(20)

            _recommendations.value = scored
            _isPersonalized.value = true
            _hasData.value = scored.isNotEmpty()
            _isLoading.value = false
        }
    }

    // clearError — called after snackbar displays so the message doesn't persist
    fun clearError() { _error.value = null }

    companion object {
        // factory — builds repos from the shared Room database instance
        fun factory(context: Context) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val db = CinephileDatabase.getInstance(context)
                return RecommendationViewModel(
                    MovieRepository(db.movieDao(), RetrofitClient.tmdbApi),
                    WatchlistRepository(db.watchlistDao())
                ) as T
            }
        }
    }
}

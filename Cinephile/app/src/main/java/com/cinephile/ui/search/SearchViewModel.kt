package com.cinephile.ui.search

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.cinephile.data.local.CinephileDatabase
import com.cinephile.data.model.Genre
import com.cinephile.data.model.Movie
import com.cinephile.data.model.WatchlistMovieCrossRef
import com.cinephile.data.remote.RetrofitClient
import com.cinephile.data.repository.MovieRepository
import com.cinephile.data.repository.WatchlistRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch

// ViewModel for the search screen — paginated results, filter state, genre list
class SearchViewModel(
    private val movieRepo: MovieRepository,
    private val watchlistRepo: WatchlistRepository
) : ViewModel() {

    private val _searchResults = MutableStateFlow<List<Movie>>(emptyList())
    val searchResults: StateFlow<List<Movie>> = _searchResults.asStateFlow()

    // genre list — fetched once for the filter spinner
    private val _genres = MutableStateFlow<List<Genre>>(emptyList())
    val genres: StateFlow<List<Genre>> = _genres.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // canLoadMore — true when there are more pages left to fetch
    private val _canLoadMore = MutableStateFlow(false)

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    // last search params — survived config changes, used to restore filter field values
    var lastQuery = ""
        private set
    var lastYear: Int? = null
        private set
    var lastGenreIndex: Int = 0
        private set
    var lastActorName: String? = null
        private set
    var lastDirectorName: String? = null
        private set

    // hasSearched — true only after a search completes; controls empty-state visibility
    var hasSearched = false
        private set

    private var lastGenreId: Int? = null
    private var currentPage = 0
    private var totalPages = 0

    init { loadGenres() }

    // loadGenres — fetch genre list once to populate the filter spinner
    private fun loadGenres() {
        viewModelScope.launch {
            runCatching { _genres.value = movieRepo.getGenreList() }
        }
    }

    // search — store filter params, reset pagination state, fetch page 1
    fun search(
        query: String,
        year: Int? = null,
        genreId: Int? = null,
        genreIndex: Int = 0,
        actorName: String? = null,
        directorName: String? = null
    ) {
        lastQuery = query
        lastYear = year
        lastGenreId = genreId
        lastGenreIndex = genreIndex
        lastActorName = actorName
        lastDirectorName = directorName
        currentPage = 0
        totalPages = 0
        hasSearched = false
        _searchResults.value = emptyList()
        _canLoadMore.value = false
        fetchPage(1)
    }

    // loadMoreResults — triggered by scroll-to-bottom; appends next page
    fun loadMoreResults() {
        if (!_canLoadMore.value || _isLoading.value) return
        fetchPage(currentPage + 1)
    }

    // fetchPage — page 1 replaces results; subsequent pages are appended
    private fun fetchPage(page: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val result = movieRepo.searchMovies(
                    lastQuery, lastYear, lastGenreId, lastActorName, lastDirectorName, page
                )
                _searchResults.value = if (page == 1) result.movies
                                       else _searchResults.value + result.movies
                currentPage = page
                totalPages = result.totalPages
                _canLoadMore.value = currentPage < totalPages
                hasSearched = true
            } catch (_: Exception) {
                if (page == 1) _searchResults.value = emptyList()
                hasSearched = true
                _error.value = "Network error. Please try again."
            } finally {
                _isLoading.value = false
            }
        }
    }

    // clearError — called after snackbar displays so the message doesn't re-show
    fun clearError() { _error.value = null }

    // addToCurrentWatchlist — upsert movie then add cross-ref to the active watchlist
    suspend fun addToCurrentWatchlist(movie: Movie): Boolean {
        val current = watchlistRepo.getCurrentWatchlist().firstOrNull() ?: return false
        movieRepo.upsertMovie(movie)
        watchlistRepo.addMovieToWatchlist(WatchlistMovieCrossRef(current.id, movie.id))
        return true
    }

    companion object {
        // factory — builds repos from the shared Room database instance
        fun factory(context: Context) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val db = CinephileDatabase.getInstance(context)
                return SearchViewModel(
                    MovieRepository(db.movieDao(), RetrofitClient.tmdbApi),
                    WatchlistRepository(db.watchlistDao())
                ) as T
            }
        }
    }
}

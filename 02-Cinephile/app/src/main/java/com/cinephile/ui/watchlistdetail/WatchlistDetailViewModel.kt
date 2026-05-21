package com.cinephile.ui.watchlistdetail

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.cinephile.data.local.CinephileDatabase
import com.cinephile.data.model.Movie
import com.cinephile.data.repository.WatchlistRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.shareIn
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

// ViewModel for the watchlist detail screen — name, favorites flag, and movie list
class WatchlistDetailViewModel(
    private val repo: WatchlistRepository,
    private val watchlistId: Long
) : ViewModel() {

    // shared upstream flow for this watchlist — re-used for name and isFavorites to avoid two queries
    private val watchlistFlow = repo.getAllWatchlists()
        .map { list -> list.firstOrNull { it.id == watchlistId } }
        .shareIn(viewModelScope, SharingStarted.WhileSubscribed(5000), replay = 1)

    // watchlist name — drives the title TextView at the top of the screen
    val watchlistName: StateFlow<String> = watchlistFlow
        .map { it?.name ?: "" }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "")

    // favorites flag — shows the gold banner strip when true
    val isFavorites: StateFlow<Boolean> = watchlistFlow
        .map { it?.isFavorites ?: false }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    // movies in this watchlist — drives the RecyclerView
    val movies: StateFlow<List<Movie>> = repo.getMoviesForWatchlist(watchlistId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // removeMovie — removes the cross-ref row; the movie record itself stays in the db
    fun removeMovie(movieId: Int) {
        viewModelScope.launch { repo.removeMovieFromWatchlist(watchlistId, movieId) }
    }

    companion object {
        // factory — scoped to a specific watchlistId passed via nav args
        fun factory(context: Context, watchlistId: Long) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val db = CinephileDatabase.getInstance(context)
                return WatchlistDetailViewModel(
                    WatchlistRepository(db.watchlistDao()),
                    watchlistId
                ) as T
            }
        }
    }
}

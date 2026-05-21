package com.cinephile.ui.details

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.cinephile.data.local.CinephileDatabase
import com.cinephile.data.model.Movie
import com.cinephile.data.model.Watchlist
import com.cinephile.data.model.WatchlistMovieCrossRef
import com.cinephile.data.remote.RetrofitClient
import com.cinephile.data.repository.MovieRepository
import com.cinephile.data.repository.WatchlistRepository
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

// ViewModel for the details screen — loads movie data and manages favorites/watchlist state
class DetailsViewModel(
    private val movieRepo: MovieRepository,
    private val watchlistRepo: WatchlistRepository,
    val movieId: Int
) : ViewModel() {

    private val _movie = MutableStateFlow<Movie?>(null)
    val movie: StateFlow<Movie?> = _movie.asStateFlow()

    // isInAnyWatchlist — excludes Favorites watchlist so the star button doesn't affect this
    val isInAnyWatchlist: StateFlow<Boolean> =
        watchlistRepo.getWatchlistsContainingMovie(movieId)
            .map { list -> list.any { !it.isFavorites } }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    init {
        // load movie details — network first, Room cache emits if network fails
        viewModelScope.launch {
            movieRepo.getMovieDetails(movieId)
                .catch { /* serve from cache */ }
                .collect { _movie.value = it }
        }
    }

    // toggle favorites — also adds/removes the movie from the Favorites watchlist
    fun toggleFavorite() {
        val willBeFavorite = !(_movie.value?.isFavorite ?: false)
        viewModelScope.launch {
            withContext(NonCancellable) {
                movieRepo.toggleFavorite(movieId)
                // sync with the special Favorites watchlist
                val favWatchlist = watchlistRepo.getFavoritesWatchlistOnce()
                if (favWatchlist != null) {
                    if (willBeFavorite) {
                        watchlistRepo.addMovieToWatchlist(WatchlistMovieCrossRef(favWatchlist.id, movieId))
                    } else {
                        watchlistRepo.removeMovieFromWatchlist(favWatchlist.id, movieId)
                    }
                }
            }
        }
    }

    // rating — persist star rating; NonCancellable prevents loss if user navigates away
    fun setRating(rating: Float) {
        viewModelScope.launch { withContext(NonCancellable) { movieRepo.setRating(movieId, rating) } }
    }

    // one-shot fetch of non-Favorites watchlists for the picker dialog
    suspend fun fetchWatchlists(): List<Watchlist> =
        watchlistRepo.getAllWatchlists().firstOrNull()?.filter { !it.isFavorites } ?: emptyList()

    // one-shot fetch of non-Favorites watchlists that currently contain this movie
    suspend fun fetchWatchlistsContainingMovie(): List<Watchlist> =
        watchlistRepo.getWatchlistsContainingMovie(movieId).firstOrNull()
            ?.filter { !it.isFavorites } ?: emptyList()

    // add this movie to a chosen watchlist
    fun addToWatchlist(watchlistId: Long) {
        viewModelScope.launch {
            watchlistRepo.addMovieToWatchlist(WatchlistMovieCrossRef(watchlistId, movieId))
        }
    }

    // remove this movie from a chosen watchlist
    fun removeFromWatchlist(watchlistId: Long) {
        viewModelScope.launch {
            watchlistRepo.removeMovieFromWatchlist(watchlistId, movieId)
        }
    }

    companion object {
        // factory — constructs repos from the shared Room instance, scoped to this movieId
        fun factory(context: Context, movieId: Int) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val db = CinephileDatabase.getInstance(context)
                return DetailsViewModel(
                    MovieRepository(db.movieDao(), RetrofitClient.tmdbApi),
                    WatchlistRepository(db.watchlistDao()),
                    movieId
                ) as T
            }
        }
    }
}

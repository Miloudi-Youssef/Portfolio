package com.cinephile.ui.watchlist

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.cinephile.data.local.CinephileDatabase
import com.cinephile.data.model.Watchlist
import com.cinephile.data.repository.WatchlistRepository
import com.cinephile.ui.adapters.WatchlistItem
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

// ViewModel for the watchlist list screen — create, rename, delete, set current
class WatchlistViewModel(private val repo: WatchlistRepository) : ViewModel() {

    // raw watchlist list — used internally and for other screens that need the list
    val watchlists: StateFlow<List<Watchlist>> = repo.getAllWatchlists()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // watchlist display items — combine watchlists with their movie counts for the adapter
    val watchlistItems: StateFlow<List<WatchlistItem>> =
        combine(repo.getAllWatchlists(), repo.getMovieCounts()) { lists, counts ->
            val countMap = counts.associate { it.watchlistId to it.movieCount }
            lists.map { wl -> WatchlistItem(wl, countMap[wl.id] ?: 0) }
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // create a new named watchlist
    fun createWatchlist(name: String) {
        viewModelScope.launch { repo.insert(Watchlist(name = name)) }
    }

    // delete watchlist — guarded against Favorites; re-assigns current if needed
    fun deleteWatchlist(watchlist: Watchlist) {
        // favorites watchlist — never deletable
        if (watchlist.isFavorites) return
        viewModelScope.launch {
            repo.delete(watchlist)
            // if the deleted watchlist was current, promote the next one
            if (watchlist.isCurrent) {
                val next = repo.getAllWatchlists().firstOrNull()?.firstOrNull()
                if (next != null) repo.setCurrentWatchlist(next.id)
            }
        }
    }

    // rename a watchlist — caller must guard against renaming Favorites
    fun renameWatchlist(id: Long, name: String) {
        viewModelScope.launch { repo.rename(id, name) }
    }

    // set active watchlist — long-pressing "Set Current" in the adapter triggers this
    fun setCurrentWatchlist(id: Long) {
        viewModelScope.launch { repo.setCurrentWatchlist(id) }
    }

    companion object {
        // factory — constructs repo from the shared Room instance
        fun factory(context: Context) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val db = CinephileDatabase.getInstance(context)
                return WatchlistViewModel(WatchlistRepository(db.watchlistDao())) as T
            }
        }
    }
}

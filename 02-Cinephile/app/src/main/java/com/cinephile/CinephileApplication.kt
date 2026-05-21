package com.cinephile

import android.app.Application
import com.cinephile.data.local.CinephileDatabase
import com.cinephile.data.repository.WatchlistRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

// App entry point — seeds the default "Favorites" watchlist on first launch
class CinephileApplication : Application() {

    // app-wide IO scope; SupervisorJob prevents one failure from killing the rest
    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    // onCreate — boot-time seed: ensure at least one watchlist (Favorites) exists
    override fun onCreate() {
        super.onCreate()
        appScope.launch {
            val db = CinephileDatabase.getInstance(this@CinephileApplication)
            // favorites watchlist — created here if missing, never deleted by user
            WatchlistRepository(db.watchlistDao()).ensureDefaultWatchlist()
        }
    }
}

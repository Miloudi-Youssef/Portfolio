package com.cinephile.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import com.cinephile.data.model.Movie
import com.cinephile.data.model.Watchlist
import com.cinephile.data.model.WatchlistMovieCrossRef
import kotlinx.coroutines.flow.Flow

// DAO for watchlists — manages the list, current selection, and movie membership
@Dao
interface WatchlistDao {

    // all watchlists; favorites watchlist always first, then by creation order
    @Query("SELECT * FROM watchlists ORDER BY isFavorites DESC, id ASC")
    fun getAllWatchlists(): Flow<List<Watchlist>>

    // currently-active watchlist — used for long-press "add to watchlist" in search
    @Query("SELECT * FROM watchlists WHERE isCurrent = 1 LIMIT 1")
    fun getCurrentWatchlist(): Flow<Watchlist?>

    // setCurrentWatchlist — atomic swap: clear old current, mark new one
    @Transaction
    suspend fun setCurrentWatchlist(id: Long) {
        clearCurrentWatchlist()
        markAsCurrent(id)
    }

    // clear all isCurrent flags before marking a new one
    @Query("UPDATE watchlists SET isCurrent = 0")
    suspend fun clearCurrentWatchlist()

    // mark a specific watchlist as current
    @Query("UPDATE watchlists SET isCurrent = 1 WHERE id = :id")
    suspend fun markAsCurrent(id: Long)

    // insert a new watchlist — returns generated id
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(watchlist: Watchlist): Long

    // rename — only name changes, all other columns untouched
    @Query("UPDATE watchlists SET name = :name WHERE id = :id")
    suspend fun rename(id: Long, name: String)

    // delete watchlist — caller must not pass the Favorites watchlist
    @Delete
    suspend fun delete(watchlist: Watchlist)

    // add movie to watchlist via cross-ref; IGNORE prevents duplicates
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun addMovieToWatchlist(crossRef: WatchlistMovieCrossRef)

    // remove a specific movie from a specific watchlist
    @Query("DELETE FROM WatchlistMovieCrossRef WHERE watchlistId = :watchlistId AND movieId = :movieId")
    suspend fun removeMovieFromWatchlist(watchlistId: Long, movieId: Int)

    // movies in a watchlist — JOIN through cross-ref table
    @Query("""
        SELECT movies.* FROM movies
        INNER JOIN WatchlistMovieCrossRef ON movies.id = WatchlistMovieCrossRef.movieId
        WHERE WatchlistMovieCrossRef.watchlistId = :watchlistId
    """)
    fun getMoviesForWatchlist(watchlistId: Long): Flow<List<Movie>>

    // movie counts per watchlist — used to show count badge on each card
    @Query("SELECT watchlistId, COUNT(*) as movieCount FROM WatchlistMovieCrossRef GROUP BY watchlistId")
    fun getMovieCounts(): Flow<List<WatchlistMovieCount>>

    // reverse lookup — which watchlists contain a given movie (for "Add/Remove" button state)
    @Query("""
        SELECT watchlists.* FROM watchlists
        INNER JOIN WatchlistMovieCrossRef ON watchlists.id = WatchlistMovieCrossRef.watchlistId
        WHERE WatchlistMovieCrossRef.movieId = :movieId
    """)
    fun getWatchlistsContainingMovie(movieId: Int): Flow<List<Watchlist>>

    // favorites watchlist as a Flow — used to auto-sync favorites on toggle
    @Query("SELECT * FROM watchlists WHERE isFavorites = 1 LIMIT 1")
    fun getFavoritesWatchlistFlow(): Flow<Watchlist?>

    // favorites watchlist as a one-shot suspend — used inside toggleFavorite
    @Query("SELECT * FROM watchlists WHERE isFavorites = 1 LIMIT 1")
    suspend fun getFavoritesWatchlist(): Watchlist?
}

// projection for the movie-count aggregation query
data class WatchlistMovieCount(val watchlistId: Long, val movieCount: Int)

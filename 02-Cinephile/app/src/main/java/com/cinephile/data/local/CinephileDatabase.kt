package com.cinephile.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.cinephile.data.model.Movie
import com.cinephile.data.model.Quiz
import com.cinephile.data.model.QuizAttempt
import com.cinephile.data.model.Watchlist
import com.cinephile.data.model.WatchlistMovieCrossRef

// Room database — all entities and DAOs for movies, watchlists, quizzes, and attempt history
@TypeConverters(Converters::class)
@Database(
    entities = [Movie::class, Watchlist::class, WatchlistMovieCrossRef::class, Quiz::class, QuizAttempt::class],
    version = 4,
    exportSchema = false
)
abstract class CinephileDatabase : RoomDatabase() {

    // DAO accessors — one per domain area
    abstract fun movieDao(): MovieDao
    abstract fun watchlistDao(): WatchlistDao
    abstract fun quizDao(): QuizDao
    abstract fun quizAttemptDao(): QuizAttemptDao

    companion object {
        // @Volatile ensures the singleton is visible across threads immediately
        @Volatile private var INSTANCE: CinephileDatabase? = null

        // getInstance — thread-safe singleton; destroys and rebuilds on schema mismatch
        fun getInstance(context: Context): CinephileDatabase {
            return INSTANCE ?: synchronized(this) {
                Room.databaseBuilder(
                    context.applicationContext,
                    CinephileDatabase::class.java,
                    "cinephile_db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}

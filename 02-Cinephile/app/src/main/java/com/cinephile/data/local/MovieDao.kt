package com.cinephile.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.cinephile.data.model.Movie
import kotlinx.coroutines.flow.Flow

// DAO for the movies table — cache layer for TMDB data, favorites, and ratings
@Dao
interface MovieDao {

    // upsert — insert or replace; used after every TMDB fetch to keep cache fresh
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(movie: Movie)

    // fetch single movie by id as a Flow — emits null if not yet cached
    @Query("SELECT * FROM movies WHERE id = :id")
    fun getMovieById(id: Int): Flow<Movie?>

    // favorites — all movies marked isFavorite, used for recommendation profiling
    @Query("SELECT * FROM movies WHERE isFavorite = 1")
    fun getFavorites(): Flow<List<Movie>>

    // rated movies — all movies where the user has set a rating > 0
    @Query("SELECT * FROM movies WHERE userRating > 0")
    fun getRatedMovies(): Flow<List<Movie>>

    // toggle favorites flag — preserves all other columns
    @Query("UPDATE movies SET isFavorite = :isFavorite WHERE id = :id")
    suspend fun updateFavorite(id: Int, isFavorite: Boolean)

    // rating — persist user star rating (0–5 scale, 0.5 steps)
    @Query("UPDATE movies SET userRating = :rating WHERE id = :id")
    suspend fun updateRating(id: Int, rating: Float)
}

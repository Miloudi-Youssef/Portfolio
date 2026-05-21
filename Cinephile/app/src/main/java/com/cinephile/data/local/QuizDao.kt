package com.cinephile.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.cinephile.data.model.Quiz
import kotlinx.coroutines.flow.Flow

// DAO for the quizzes table — CRUD and score tracking
@Dao
interface QuizDao {

    // all quizzes ordered by creation; drives the quiz list screen
    @Query("SELECT * FROM quizzes ORDER BY id ASC")
    fun getAllQuizzes(): Flow<List<Quiz>>

    // insert new quiz — returns generated id used when navigating to detail
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(quiz: Quiz): Long

    // delete quiz — caller must also delete attempt history via QuizAttemptDao
    @Delete
    suspend fun delete(quiz: Quiz)

    // update last score shown on the quiz card after a play session
    @Query("UPDATE quizzes SET lastScore = :score WHERE id = :id")
    suspend fun updateScore(id: Long, score: Int)
}

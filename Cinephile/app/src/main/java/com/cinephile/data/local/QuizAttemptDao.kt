package com.cinephile.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import com.cinephile.data.model.QuizAttempt
import kotlinx.coroutines.flow.Flow

// DAO for attempt history — records each completed quiz play session
@Dao
interface QuizAttemptDao {

    // save a new attempt record after the player exits a quiz
    @Insert
    suspend fun insert(attempt: QuizAttempt)

    // attempt history for a quiz, newest-first — drives the history RecyclerView
    @Query("SELECT * FROM quiz_attempts WHERE quizId = :quizId ORDER BY timestamp DESC")
    fun getAttemptsForQuiz(quizId: Long): Flow<List<QuizAttempt>>

    // delete all attempt history for a quiz — called before deleting the quiz itself
    @Query("DELETE FROM quiz_attempts WHERE quizId = :quizId")
    suspend fun deleteAttemptsForQuiz(quizId: Long)
}

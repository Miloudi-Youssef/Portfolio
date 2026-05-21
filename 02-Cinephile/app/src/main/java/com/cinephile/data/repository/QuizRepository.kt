package com.cinephile.data.repository

import com.cinephile.data.local.QuizAttemptDao
import com.cinephile.data.local.QuizDao
import com.cinephile.data.model.Quiz
import com.cinephile.data.model.QuizAttempt
import kotlinx.coroutines.flow.Flow

// repository bridging quiz and attempt DAOs — keeps the ViewModel free of DAO details
class QuizRepository(
    private val dao: QuizDao,
    private val attemptDao: QuizAttemptDao
) {

    // all quizzes as a live Flow — drives the quiz list screen
    fun getAllQuizzes(): Flow<List<Quiz>> = dao.getAllQuizzes()

    // create a new quiz — returns the auto-generated id
    suspend fun insert(quiz: Quiz): Long = dao.insert(quiz)

    // delete a quiz card — caller must delete attempt history first
    suspend fun delete(quiz: Quiz) = dao.delete(quiz)

    // update the last score badge shown on the quiz card
    suspend fun updateScore(id: Long, score: Int) = dao.updateScore(id, score)

    // attempt history for a quiz — newest-first Flow for the detail screen
    fun getAttemptsForQuiz(quizId: Long): Flow<List<QuizAttempt>> =
        attemptDao.getAttemptsForQuiz(quizId)

    // save a completed play session to attempt history
    suspend fun insertAttempt(attempt: QuizAttempt) = attemptDao.insert(attempt)

    // delete all attempt history before deleting the quiz itself
    suspend fun deleteAttemptsForQuiz(quizId: Long) = attemptDao.deleteAttemptsForQuiz(quizId)
}

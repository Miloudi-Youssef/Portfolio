package com.cinephile.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

// attempt history — one row per completed quiz play session
@Entity(tableName = "quiz_attempts")
data class QuizAttempt(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val quizId: Long,        // FK to quizzes.id
    val score: Int,          // points earned (time-bonus scoring: 1–3 pts per question)
    val maxScore: Int,       // theoretical max = number of questions × 3
    val timestamp: Long = System.currentTimeMillis()  // epoch ms, formatted for display
)

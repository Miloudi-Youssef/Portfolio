package com.cinephile.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

// difficulty — controls which question types are allowed during quiz generation
enum class Difficulty { EASY, MEDIUM, HARD }

// Room entity for a saved quiz configuration tied to a watchlist
@Entity(tableName = "quizzes")
data class Quiz(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val watchlistId: Long,           // which watchlist's movies to draw questions from
    val lastScore: Int? = null,      // most recent score shown on the quiz card; null = never played
    val difficulty: String = Difficulty.MEDIUM.name  // stored as enum name string
)

package com.cinephile.data.model

// cast member — mapped from TMDB credits, stored as JSON inside the movies table
data class Actor(
    val id: Int,
    val name: String,
    val character: String,
    val profilePath: String?  // null when TMDB has no photo for this actor
)

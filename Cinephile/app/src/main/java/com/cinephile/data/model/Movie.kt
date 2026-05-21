package com.cinephile.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

// Room entity for cached movie data; genres and cast stored as JSON via Converters
@Entity(tableName = "movies")
data class Movie(
    @PrimaryKey val id: Int,
    val title: String,
    val posterPath: String?,           // TMDB relative path, null for movies without art
    val backdropPath: String? = null,  // wide backdrop used in details header
    val overview: String,
    val releaseDate: String,           // ISO format "YYYY-MM-DD"
    val genres: List<Genre> = emptyList(),  // genre chips — populated from movie/{id} endpoint
    val cast: List<Actor> = emptyList(),    // top 10 billed cast, sorted by order
    val director: String? = null,          // first crew member with job == "Director"
    val isFavorite: Boolean = false,       // favorites flag — synced with Favorites watchlist
    val userRating: Float = 0f             // rating bar — 0 means unrated, range 0.5–5.0
)

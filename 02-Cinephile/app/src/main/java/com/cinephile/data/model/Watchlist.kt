package com.cinephile.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

// Room entity for a user-created watchlist
@Entity(tableName = "watchlists")
data class Watchlist(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val isCurrent: Boolean = false,   // active watchlist — long-press adds go here
    val isFavorites: Boolean = false  // favorites watchlist — hidden from delete/rename, always first
)

package com.cinephile.data.model

import androidx.room.Entity

// many-to-many join table linking watchlists to movies
@Entity(primaryKeys = ["watchlistId", "movieId"])
data class WatchlistMovieCrossRef(
    val watchlistId: Long,
    val movieId: Int
)

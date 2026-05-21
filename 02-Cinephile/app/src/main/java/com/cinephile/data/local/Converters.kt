package com.cinephile.data.local

import androidx.room.TypeConverter
import com.cinephile.data.model.Actor
import com.cinephile.data.model.Genre
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

// Room TypeConverters — serialize genre and actor lists to JSON for SQLite storage
class Converters {
    private val gson = Gson()

    // genre list → JSON string for Room storage
    @TypeConverter
    fun fromGenreList(genres: List<Genre>): String = gson.toJson(genres)

    // JSON string → genre list when reading from Room
    @TypeConverter
    fun toGenreList(json: String): List<Genre> {
        val type = object : TypeToken<List<Genre>>() {}.type
        return gson.fromJson(json, type)
    }

    // actor/cast list → JSON string for Room storage
    @TypeConverter
    fun fromActorList(actors: List<Actor>): String = gson.toJson(actors)

    // JSON string → actor list when reading from Room
    @TypeConverter
    fun toActorList(json: String): List<Actor> {
        val type = object : TypeToken<List<Actor>>() {}.type
        return gson.fromJson(json, type)
    }
}

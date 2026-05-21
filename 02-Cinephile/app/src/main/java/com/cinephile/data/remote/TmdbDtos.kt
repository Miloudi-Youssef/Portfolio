package com.cinephile.data.remote

import com.cinephile.data.model.Actor
import com.cinephile.data.model.Genre
import com.cinephile.data.model.Movie
import com.google.gson.annotations.SerializedName

// TMDB API response DTOs and domain mapping extensions

// search/discover response wrapper — includes pagination info
data class SearchResponse(
    @SerializedName("results") val results: List<MovieDto>,
    @SerializedName("total_pages") val totalPages: Int
)

// raw movie shape from TMDB — search returns genre_ids, detail returns genres
data class MovieDto(
    @SerializedName("id")            val id: Int,
    @SerializedName("title")         val title: String,
    @SerializedName("poster_path")   val posterPath: String?,
    @SerializedName("backdrop_path") val backdropPath: String? = null,
    @SerializedName("overview")      val overview: String,
    @SerializedName("release_date")  val releaseDate: String,
    // search/movie returns genre_ids; movie/{id} returns genres
    @SerializedName("genre_ids")     val genreIds: List<Int>? = null,
    @SerializedName("genres")        val genres: List<GenreDto>? = null
)

// map TMDB DTO to the local Movie domain model; optionally merge credits
fun MovieDto.toMovie(credits: CreditsDto? = null): Movie {
    // director — first crew member whose job is exactly "Director"
    val director = credits?.crew?.firstOrNull { it.job == "Director" }?.name
    // cast — top 10 billed actors, sorted by billing order
    val cast = credits?.cast
        ?.sortedBy { it.order }
        ?.take(10)
        ?.map { Actor(it.id, it.name, it.character, it.profilePath) }
        ?: emptyList()
    // genre list — only populated from movie/{id} detail calls
    val genreList = genres?.map { Genre(it.id, it.name) } ?: emptyList()

    return Movie(
        id           = id,
        title        = title,
        posterPath   = posterPath,
        backdropPath = backdropPath,
        overview     = overview,
        releaseDate  = releaseDate,
        genres       = genreList,
        cast         = cast,
        director     = director
    )
}

// credits response — cast billed by order, crew filtered to find director
data class CreditsDto(
    @SerializedName("cast") val cast: List<CastDto>,
    @SerializedName("crew") val crew: List<CrewDto>
)

// single cast member from TMDB credits
data class CastDto(
    @SerializedName("id")           val id: Int,
    @SerializedName("name")         val name: String,
    @SerializedName("character")    val character: String,
    @SerializedName("profile_path") val profilePath: String?,
    @SerializedName("order")        val order: Int  // billing order — lower = more prominent
)

// single crew member — only job field matters (we look for "Director")
data class CrewDto(
    @SerializedName("id")   val id: Int,
    @SerializedName("name") val name: String,
    @SerializedName("job")  val job: String
)

// genre list response — fetched once to populate the search filter spinner
data class GenreListResponse(
    @SerializedName("genres") val genres: List<GenreDto>
)

// genre chip data from TMDB
data class GenreDto(
    @SerializedName("id")   val id: Int,
    @SerializedName("name") val name: String
)

// person search response — used to resolve actor/director names to TMDB person IDs
data class PersonSearchResponse(
    @SerializedName("results") val results: List<PersonDto>
)

// minimal person info — only id needed for discover?with_cast / with_crew filter
data class PersonDto(
    @SerializedName("id")   val id: Int,
    @SerializedName("name") val name: String
)

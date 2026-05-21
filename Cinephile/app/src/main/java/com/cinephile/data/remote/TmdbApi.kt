package com.cinephile.data.remote

import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

// TMDB v3 API surface — search, discover, and detail endpoints
interface TmdbApi {

    // search movies by title; supports optional year and genre filter
    @GET("search/movie")
    suspend fun searchMovies(
        @Query("query")       query: String,
        @Query("page")        page: Int = 1,
        @Query("year")        year: Int? = null,
        @Query("with_genres") genreId: Int? = null
    ): SearchResponse

    // load full movie detail — returns genres[] (not genre_ids), runtime, etc.
    @GET("movie/{id}")
    suspend fun getMovieDetails(@Path("id") id: Int): MovieDto

    // load poster + cast and crew for a movie
    @GET("movie/{id}/credits")
    suspend fun getMovieCredits(@Path("id") id: Int): CreditsDto

    // genre list — fetch once at startup to populate the filter spinner
    @GET("genre/movie/list")
    suspend fun getGenreList(): GenreListResponse

    // person search — resolve actor/director names to TMDB person IDs for discover
    @GET("search/person")
    suspend fun searchPerson(@Query("query") query: String): PersonSearchResponse

    // discover movies — used for recommendations and actor/director-filtered search.
    // with_cast / with_crew accept a single person id as a string.
    @GET("discover/movie")
    suspend fun discoverMovies(
        @Query("with_genres")          genreId: Int? = null,
        @Query("with_cast")            castId: String? = null,
        @Query("with_crew")            crewId: String? = null,
        @Query("primary_release_year") year: Int? = null,
        @Query("page")                 page: Int = 1
    ): SearchResponse
}

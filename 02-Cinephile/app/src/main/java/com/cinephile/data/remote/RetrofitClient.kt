package com.cinephile.data.remote

import com.cinephile.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

// lazily-built Retrofit singleton wired with auth and (debug-only) body logging
object RetrofitClient {

    val tmdbApi: TmdbApi by lazy {
        // logging — full request/response body in debug builds, silent in release
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
                    else HttpLoggingInterceptor.Level.NONE
        }

        // OkHttp client — auth interceptor runs first, then logging
        val okHttp = OkHttpClient.Builder()
            .addInterceptor(TmdbAuthInterceptor())
            .addInterceptor(logging)
            .build()

        // build Retrofit and create the TmdbApi implementation
        Retrofit.Builder()
            .baseUrl(TmdbConfig.BASE_URL)
            .client(okHttp)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(TmdbApi::class.java)
    }
}

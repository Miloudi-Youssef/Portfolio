package com.cinephile.data.remote

import okhttp3.Interceptor
import okhttp3.Response

// OkHttp interceptor — appends the TMDB api_key query param to every request
class TmdbAuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        // inject api_key into the URL so callers never have to pass it manually
        val url = original.url.newBuilder()
            .addQueryParameter("api_key", TmdbConfig.API_KEY)
            .build()
        return chain.proceed(original.newBuilder().url(url).build())
    }
}

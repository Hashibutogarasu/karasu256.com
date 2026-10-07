package com.karasu256.karasulab.data.remote

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Response

/** Logs every unsuccessful HTTP response with its status and body, leaving the response itself untouched for the caller. */
class HttpErrorLoggingInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val response = chain.proceed(chain.request())
        if (!response.isSuccessful) {
            val body = response.peekBody(MAX_LOGGED_BODY_BYTES).string()
            Log.w(TAG, "${response.request.method} ${response.request.url} -> ${response.code} $body")
        }
        return response
    }

    private companion object {
        const val TAG = "HttpError"
        const val MAX_LOGGED_BODY_BYTES = 4_096L
    }
}

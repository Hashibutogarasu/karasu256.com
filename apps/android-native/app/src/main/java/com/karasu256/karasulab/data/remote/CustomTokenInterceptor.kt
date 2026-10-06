package com.karasu256.karasulab.data.remote

import com.karasu256.karasulab.data.auth.SessionTokenExchanger
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import javax.inject.Inject

/** Sends the stored custom token as a bearer token, re-exchanging it first when it has expired. */
class CustomTokenInterceptor @Inject constructor(
    private val exchanger: SessionTokenExchanger,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = blockingIo { exchanger.validToken() } ?: return chain.proceed(chain.request())
        return chain.proceed(chain.request().withBearer(token))
    }
}

/** Returns a copy of this request carrying [token] as its bearer token. */
internal fun okhttp3.Request.withBearer(token: String): okhttp3.Request =
    newBuilder().header("Authorization", "Bearer $token").build()

/** Runs [block] on the calling OkHttp thread, surfacing every failure as an [IOException] so OkHttp reports it to the caller. */
internal fun <T> blockingIo(block: suspend () -> T): T = try {
    runBlocking { block() }
} catch (e: IOException) {
    throw e
} catch (e: Exception) {
    throw IOException(e)
}

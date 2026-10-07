package com.karasu256.karasulab.data.auth

import android.util.Base64
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import javax.inject.Inject

/** Reads when a JWT expires. */
fun interface JwtExpiry {
    /** Returns the epoch milliseconds of [token]'s `exp` claim, or null when it cannot be read. */
    fun expiresAtMillis(token: String): Long?
}

/** [JwtExpiry] that decodes the JWT payload without verifying its signature; the API verifies it. */
class Base64JwtExpiry @Inject constructor(
    private val json: Json,
) : JwtExpiry {
    override fun expiresAtMillis(token: String): Long? {
        val payload = token.split('.').getOrNull(1) ?: return null
        return runCatching {
            val decoded = Base64.decode(payload, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
            json.parseToJsonElement(decoded.toString(Charsets.UTF_8))
                .jsonObject["exp"]?.jsonPrimitive?.longOrNull?.times(1000)
        }.getOrNull()
    }
}

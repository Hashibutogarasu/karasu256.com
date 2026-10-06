package com.karasu256.karasulab.data.remote

import okhttp3.Cookie
import retrofit2.Response

/**
 * A better-auth session cookie as the server set it.
 *
 * @property name cookie name, including any `__Secure-` prefix.
 * @property value signed cookie value.
 * @property expiresAtMillis epoch milliseconds at which the cookie expires.
 */
data class SessionCookie(
    val name: String,
    val value: String,
    val expiresAtMillis: Long,
) {
    /** Renders this cookie as a `Cookie` request header value. */
    fun toHeader(): String = "$name=$value"

    /** Factory functions for [SessionCookie]. */
    companion object {
        private const val SESSION_TOKEN_SUFFIX = "better-auth.session_token"

        /** Returns the session cookie set by [response], or null when the response set none. */
        fun from(response: Response<*>): SessionCookie? = response.setCookies()
            .firstOrNull { it.name.endsWith(SESSION_TOKEN_SUFFIX) && it.value.isNotEmpty() }
            ?.let { SessionCookie(it.name, it.value, it.expiresAt) }
    }
}

/** Parses every `Set-Cookie` header of this response against the URL it was requested from. */
fun Response<*>.setCookies(): List<Cookie> {
    val url = raw().request.url
    return headers().values("Set-Cookie").mapNotNull { Cookie.parse(url, it) }
}

package com.karasu256.karasulab.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * The signed-in user's credentials: the better-auth session cookie and the custom token
 * exchanged for it. Only a single row (with [id] `0`) ever exists.
 *
 * @property sessionCookieName name of the better-auth session cookie, e.g. `__Secure-better-auth.session_token`.
 * @property sessionCookieValue signed value of the session cookie.
 * @property sessionExpiresAtMs epoch milliseconds at which the session cookie expires.
 * @property customToken JWT returned in the `set-auth-jwt` header, sent to the API as a bearer token.
 * @property customTokenExpiresAtMs epoch milliseconds at which [customToken] expires, or `0` when unknown.
 */
@Entity(tableName = "auth_token")
data class AuthTokenEntity(
    @PrimaryKey val id: Int = SINGLETON_ID,
    val sessionCookieName: String,
    val sessionCookieValue: String,
    val sessionExpiresAtMs: Long,
    val customToken: String,
    val customTokenExpiresAtMs: Long,
) {
    /** Constants for [AuthTokenEntity]. */
    companion object {
        /** Primary key of the only row the table holds. */
        const val SINGLETON_ID = 0
    }
}

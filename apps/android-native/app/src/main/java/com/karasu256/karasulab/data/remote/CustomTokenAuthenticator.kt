package com.karasu256.karasulab.data.remote

import com.karasu256.karasulab.data.auth.SessionTokenExchanger
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import javax.inject.Inject

/** Retries a request rejected with 401 once, after re-exchanging the session for a new custom token. */
class CustomTokenAuthenticator @Inject constructor(
    private val exchanger: SessionTokenExchanger,
) : Authenticator {
    override fun authenticate(route: Route?, response: Response): Request? {
        if (response.priorResponse != null) return null
        val staleToken = response.request.header("Authorization")?.removePrefix("Bearer ")
        val token = blockingIo { exchanger.reexchange(staleToken) } ?: return null
        return response.request.withBearer(token)
    }
}

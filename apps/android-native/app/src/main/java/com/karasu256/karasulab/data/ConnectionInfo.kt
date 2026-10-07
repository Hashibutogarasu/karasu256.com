package com.karasu256.karasulab.data

/**
 * Where the app is connected to.
 *
 * @property apiHost the host the API reports it is served from.
 * @property authHost the host of the authentication server.
 * @property branch the git branch the API was built from, or null when the API could not be reached.
 */
data class ConnectionInfo(
    val apiHost: String,
    val authHost: String,
    val branch: String?,
)

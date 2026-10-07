package com.karasu256.karasulab.data

import com.karasu256.karasulab.data.remote.RemoteHostConfig
import com.karasu256.karasulab.data.remote.UserApi
import okhttp3.HttpUrl.Companion.toHttpUrl
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.cancellation.CancellationException

/** Resolves where the app is connected to, preferring what the API reports about itself over the app's own configuration. */
@Singleton
class ConnectionRepository @Inject constructor(
    private val userApi: UserApi,
    private val hosts: RemoteHostConfig,
) {
    /** Returns the connection info; the branch is null and the API host comes from configuration when the API does not answer. */
    suspend fun load(): ConnectionInfo = try {
        val meta = userApi.meta()
        ConnectionInfo(apiHost = meta.apiUrl.toHttpUrl().host, authHost = hosts.authHost, branch = meta.gitBranch)
    } catch (e: CancellationException) {
        throw e
    } catch (_: Exception) {
        ConnectionInfo(apiHost = hosts.apiHost, authHost = hosts.authHost, branch = null)
    }
}

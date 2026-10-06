package com.karasu256.karasulab.data

import com.karasu256.karasulab.data.local.SessionStore
import com.karasu256.karasulab.data.local.UserProfileEntity
import com.karasu256.karasulab.data.remote.UserApi
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

/** Fetches the signed-in user's profile from the API and keeps it cached. */
@Singleton
class ProfileRepository @Inject constructor(
    private val userApi: UserApi,
    private val store: SessionStore,
) {
    /** Emits the cached profile, or null when none is cached. */
    val profile: Flow<UserProfileEntity?> = store.profile

    /** Fetches the profile with the custom token and replaces the cached one. Throws when the request fails. */
    suspend fun refresh() {
        val profile = userApi.profile()
        store.saveProfile(UserProfileEntity(id = profile.id, name = profile.name, image = profile.image))
    }
}

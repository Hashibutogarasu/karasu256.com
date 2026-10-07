package com.karasu256.karasulab.data.local

import androidx.room.withTransaction
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/** Persists the signed-in user's token and cached profile. */
interface SessionStore {
    /** Emits the stored token, or null while signed out. */
    val token: Flow<AuthTokenEntity?>

    /** Emits the cached profile, or null when none is cached. */
    val profile: Flow<UserProfileEntity?>

    /** Returns the stored token, or null while signed out. */
    suspend fun currentToken(): AuthTokenEntity?

    /** Stores [token], replacing any previous one. */
    suspend fun saveToken(token: AuthTokenEntity)

    /** Caches [profile], replacing any previous one. */
    suspend fun saveProfile(profile: UserProfileEntity)

    /** Deletes the token and the cached profile together. */
    suspend fun clear()
}

/** [SessionStore] backed by [AppDatabase]. */
class RoomSessionStore @Inject constructor(
    private val database: AppDatabase,
) : SessionStore {
    override val token: Flow<AuthTokenEntity?> = database.authTokenDao().observe()

    override val profile: Flow<UserProfileEntity?> = database.userProfileDao().observe()

    override suspend fun currentToken(): AuthTokenEntity? = database.authTokenDao().get()

    override suspend fun saveToken(token: AuthTokenEntity) {
        database.authTokenDao().upsert(token)
    }

    override suspend fun saveProfile(profile: UserProfileEntity) {
        database.userProfileDao().replace(profile)
    }

    override suspend fun clear() {
        database.withTransaction {
            database.authTokenDao().clear()
            database.userProfileDao().clear()
        }
    }
}

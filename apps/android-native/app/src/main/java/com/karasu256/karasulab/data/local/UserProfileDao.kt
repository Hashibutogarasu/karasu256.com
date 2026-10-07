package com.karasu256.karasulab.data.local

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

/** Reads and writes the cached [UserProfileEntity]. */
@Dao
interface UserProfileDao {
    /** Emits the cached profile, or null when none is cached. */
    @Query("SELECT * FROM user_profile LIMIT 1")
    fun observe(): Flow<UserProfileEntity?>

    /** Inserts or replaces [profile]. */
    @Upsert
    suspend fun upsert(profile: UserProfileEntity)

    /** Deletes every cached profile. */
    @Query("DELETE FROM user_profile")
    suspend fun clear()

    /** Replaces whatever is cached with [profile], so only one user's profile is ever kept. */
    @Transaction
    suspend fun replace(profile: UserProfileEntity) {
        clear()
        upsert(profile)
    }
}

package com.karasu256.karasulab.data.local

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

/** Reads and writes the single [AuthTokenEntity] row. */
@Dao
interface AuthTokenDao {
    /** Emits the stored token, or null while signed out. */
    @Query("SELECT * FROM auth_token WHERE id = ${AuthTokenEntity.SINGLETON_ID}")
    fun observe(): Flow<AuthTokenEntity?>

    /** Returns the stored token, or null while signed out. */
    @Query("SELECT * FROM auth_token WHERE id = ${AuthTokenEntity.SINGLETON_ID}")
    suspend fun get(): AuthTokenEntity?

    /** Inserts or replaces the stored token. */
    @Upsert
    suspend fun upsert(token: AuthTokenEntity)

    /** Deletes the stored token. */
    @Query("DELETE FROM auth_token")
    suspend fun clear()
}

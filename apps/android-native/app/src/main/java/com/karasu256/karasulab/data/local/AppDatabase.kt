package com.karasu256.karasulab.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

/** The app's Room database holding the auth token and the cached user profile. */
@Database(entities = [AuthTokenEntity::class, UserProfileEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    /** Returns the DAO for [AuthTokenEntity]. */
    abstract fun authTokenDao(): AuthTokenDao

    /** Returns the DAO for [UserProfileEntity]. */
    abstract fun userProfileDao(): UserProfileDao

    /** Constants for [AppDatabase]. */
    companion object {
        /** File name of the database. */
        const val NAME = "app.db"
    }
}

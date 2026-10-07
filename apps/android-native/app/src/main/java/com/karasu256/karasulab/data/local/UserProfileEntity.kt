package com.karasu256.karasulab.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Cached copy of the signed-in user's profile as returned by the API.
 *
 * @property id the user's id.
 * @property name display name, or null when the user has not set one.
 * @property image avatar URL, or null when the user has none.
 */
@Entity(tableName = "user_profile")
data class UserProfileEntity(
    @PrimaryKey val id: String,
    val name: String?,
    val image: String?,
)

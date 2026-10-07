package com.karasu256.karasulab.init

import android.content.res.Resources
import androidx.annotation.StringRes

/** Describes a step of the app's launch work with a title and a description held as string resources. */
data class StepInfo(
    @param:StringRes val titleRes: Int,
    @param:StringRes val descriptionRes: Int,
) {
    /** Returns the step's title resolved from [resources]. */
    fun getTitle(resources: Resources): String = resources.getString(titleRes)

    /** Returns the step's description resolved from [resources]. */
    fun getDescription(resources: Resources): String = resources.getString(descriptionRes)
}

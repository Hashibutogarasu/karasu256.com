package com.karasu256.karasulab.init

import com.karasu256.karasulab.R
import javax.inject.Inject

/** Initializes Firebase. The Firebase SDK is not added yet, so this step does nothing for now. */
class FirebaseInitializer @Inject constructor() : IInitializable {
    override suspend fun init() = Unit

    override fun getStepInfo(): StepInfo = StepInfo(
        titleRes = R.string.step_firebase_title,
        descriptionRes = R.string.step_firebase_description,
    )
}

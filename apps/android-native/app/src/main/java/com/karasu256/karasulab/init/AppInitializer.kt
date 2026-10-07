package com.karasu256.karasulab.init

import com.karasu256.karasulab.R
import com.karasu256.karasulab.data.AuthRepository
import kotlinx.coroutines.flow.first
import javax.inject.Inject

/** Initializes the app itself by reading the stored session, which decides the first screen. */
class AppInitializer @Inject constructor(
    private val authRepository: AuthRepository,
) : IInitializable {
    override suspend fun init() {
        authRepository.isSignedIn.first()
    }

    override fun getStepInfo(): StepInfo = StepInfo(
        titleRes = R.string.step_app_title,
        descriptionRes = R.string.step_app_description,
    )
}

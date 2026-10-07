package com.karasu256.karasulab.init

import android.content.Context
import com.google.firebase.FirebaseApp
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.karasu256.karasulab.R
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject

/** Initializes Firebase, then Authentication, Crashlytics and Analytics in that order. */
class FirebaseInitializer @Inject constructor(
    @param:ApplicationContext private val context: Context,
) : IInitializable {
    override suspend fun init() {
        FirebaseApp.initializeApp(context)
        FirebaseAuth.getInstance()
        FirebaseCrashlytics.getInstance()
        FirebaseAnalytics.getInstance(context)
    }

    override fun getStepInfo(): StepInfo = StepInfo(
        titleRes = R.string.step_firebase_title,
        descriptionRes = R.string.step_firebase_description,
    )
}

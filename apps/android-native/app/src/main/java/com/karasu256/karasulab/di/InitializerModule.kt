package com.karasu256.karasulab.di

import com.karasu256.karasulab.init.AppInitializer
import com.karasu256.karasulab.init.FirebaseInitializer
import com.karasu256.karasulab.init.IInitializable
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.components.ViewModelComponent

/** Provides the launch work the loading screen runs, in the order it runs. */
@Module
@InstallIn(ViewModelComponent::class)
object InitializerModule {
    /** Provides the initializers: the app first, then Firebase. */
    @Provides
    fun provideInitializers(
        app: AppInitializer,
        firebase: FirebaseInitializer,
    ): List<@JvmSuppressWildcards IInitializable> = listOf(app, firebase)
}

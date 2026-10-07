package com.karasu256.karasulab.ui.loading

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karasu256.karasulab.init.IInitializable
import com.karasu256.karasulab.init.StepInfo
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

/** Runs every [IInitializable] in order and exposes the step currently running. */
@HiltViewModel
class LoadingViewModel @Inject constructor(
    private val initializers: List<@JvmSuppressWildcards IInitializable>,
) : ViewModel() {
    private val _currentStep = MutableStateFlow<StepInfo?>(null)

    val currentStep: StateFlow<StepInfo?> = _currentStep.asStateFlow()

    private val initialization: Deferred<Unit> = viewModelScope.async {
        initializers.forEach { initializer ->
            _currentStep.value = initializer.getStepInfo()
            initializer.init()
        }
    }

    /** Suspends until every initializer has finished. */
    suspend fun awaitInitialization() = initialization.await()
}

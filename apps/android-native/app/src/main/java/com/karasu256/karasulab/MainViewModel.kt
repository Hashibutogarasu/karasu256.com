package com.karasu256.karasulab

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karasu256.karasulab.data.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

/** Exposes whether the user is signed in, which decides the first screen and forces a return to sign-in when the session ends. */
@HiltViewModel
class MainViewModel @Inject constructor(
    authRepository: AuthRepository,
) : ViewModel() {
    /** Whether a token is stored, or null until the database has been read. */
    val isSignedIn: StateFlow<Boolean?> = authRepository.isSignedIn
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)
}

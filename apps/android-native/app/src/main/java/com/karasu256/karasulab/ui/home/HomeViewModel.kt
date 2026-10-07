package com.karasu256.karasulab.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.karasu256.karasulab.data.AuthRepository
import com.karasu256.karasulab.data.ProfileRepository
import com.karasu256.karasulab.data.local.UserProfileEntity
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlin.coroutines.cancellation.CancellationException

/** Drives the home screen: shows the cached profile, refreshes it, and signs out. */
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val profileRepository: ProfileRepository,
) : ViewModel() {
    /** The cached profile, or null when none is cached. */
    val profile: StateFlow<UserProfileEntity?> = profileRepository.profile
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    private val _isSigningOut = MutableStateFlow(false)

    /** Whether sign-out is in progress. */
    val isSigningOut: StateFlow<Boolean> = _isSigningOut.asStateFlow()

    private val _signedOut = Channel<Unit>(Channel.BUFFERED)

    /** Emits once sign-out completes. */
    val signedOut: Flow<Unit> = _signedOut.receiveAsFlow()

    init {
        viewModelScope.launch {
            try {
                profileRepository.refresh()
            } catch (e: CancellationException) {
                throw e
            } catch (_: Exception) {
            }
        }
    }

    /** Signs out, discarding the stored token and cached profile. */
    fun signOut() {
        if (_isSigningOut.value) return
        _isSigningOut.value = true
        viewModelScope.launch {
            authRepository.signOut()
            _signedOut.send(Unit)
        }
    }
}

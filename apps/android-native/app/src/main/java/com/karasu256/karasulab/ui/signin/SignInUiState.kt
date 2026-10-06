package com.karasu256.karasulab.ui.signin

import androidx.annotation.StringRes

/** The ways a user can sign in. */
enum class SignInMethod {
    /** Email address and password. */
    Email,

    /** Native Google sign-in. */
    Google,

    /** Passkey through Credential Manager. */
    Passkey,
}

/**
 * State of the sign-in screen.
 *
 * @property email the email address typed so far.
 * @property password the password typed so far.
 * @property busyMethod the sign-in method in progress, or null when idle.
 * @property errorMessage message describing the last failure, or null when there is none.
 */
data class SignInUiState(
    val email: String = "",
    val password: String = "",
    val busyMethod: SignInMethod? = null,
    @param:StringRes val errorMessage: Int? = null,
) {
    /** Whether any sign-in is in progress. */
    val isBusy: Boolean get() = busyMethod != null

    /** Whether the email form has enough input to submit. */
    val canSubmitEmail: Boolean get() = email.isNotBlank() && password.isNotEmpty()
}

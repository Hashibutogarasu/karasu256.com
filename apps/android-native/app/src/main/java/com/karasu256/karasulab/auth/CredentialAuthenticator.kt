package com.karasu256.karasulab.auth

import android.app.Activity
import androidx.credentials.Credential
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialOption
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.PublicKeyCredential
import androidx.credentials.exceptions.GetCredentialCancellationException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.karasu256.karasulab.BuildConfig

/**
 * [CredentialProvider] backed by Credential Manager. It needs an [Activity] to show its UI,
 * so it is created by the screen rather than injected into a ViewModel.
 */
class CredentialAuthenticator(private val activity: Activity) : CredentialProvider {
    private val credentialManager = CredentialManager.create(activity)

    override suspend fun requestGoogleIdToken(): String? {
        val option = GetSignInWithGoogleOption.Builder(BuildConfig.GOOGLE_SERVER_CLIENT_ID).build()
        val credential = request(option) ?: return null
        check(credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
            "Unexpected credential type: ${credential.type}"
        }
        return GoogleIdTokenCredential.createFrom(credential.data).idToken
    }

    override suspend fun requestPasskeyAssertion(requestJson: String): String? {
        val credential = request(GetPublicKeyCredentialOption(requestJson)) ?: return null
        check(credential is PublicKeyCredential) { "Unexpected credential type: ${credential.type}" }
        return credential.authenticationResponseJson
    }

    private suspend fun request(option: CredentialOption): Credential? = try {
        credentialManager.getCredential(activity, GetCredentialRequest(listOf(option))).credential
    } catch (_: GetCredentialCancellationException) {
        null
    }
}

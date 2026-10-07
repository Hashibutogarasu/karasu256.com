package com.karasu256.karasulab.ui.signin

import androidx.activity.compose.LocalActivity
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.karasu256.karasulab.R
import com.karasu256.karasulab.auth.CredentialAuthenticator
import com.karasu256.karasulab.ui.components.BaseButton
import com.karasu256.karasulab.ui.components.BrandGoogleIconButton
import com.karasu256.karasulab.ui.components.BrandPasskeyIconButton
import com.ramcosta.composedestinations.annotation.Destination
import com.ramcosta.composedestinations.annotation.RootGraph
import com.ramcosta.composedestinations.generated.NavGraphs
import com.ramcosta.composedestinations.generated.destinations.HomeScreenDestination
import com.ramcosta.composedestinations.navigation.DestinationsNavigator

/** Sign-in screen shown while signed out. Navigates to the home screen once sign-in completes. */
@Destination<RootGraph>(start = true)
@Composable
fun SignInScreen(
    navigator: DestinationsNavigator,
    viewModel: SignInViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val activity = LocalActivity.current
    val credentials = remember(activity) { activity?.let(::CredentialAuthenticator) }

    LaunchedEffect(viewModel) {
        viewModel.signedIn.collect {
            navigator.navigate(HomeScreenDestination) {
                popUpTo(NavGraphs.root) { inclusive = true }
            }
        }
    }

    SignInContent(
        state = state,
        onEmailChange = viewModel::onEmailChange,
        onPasswordChange = viewModel::onPasswordChange,
        onSignIn = viewModel::signInWithEmail,
        onGoogle = { credentials?.let(viewModel::signInWithGoogle) },
        onPasskey = { credentials?.let(viewModel::signInWithPasskey) },
    )
}

/** Stateless layout of the sign-in screen. */
@Composable
private fun SignInContent(
    state: SignInUiState,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onSignIn: () -> Unit,
    onGoogle: () -> Unit,
    onPasskey: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .imePadding()
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = stringResource(R.string.brand_title),
            style = MaterialTheme.typography.displayMedium,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(48.dp))
        OutlinedTextField(
            value = state.email,
            onValueChange = onEmailChange,
            modifier = Modifier.fillMaxWidth(),
            enabled = !state.isBusy,
            label = { Text(stringResource(R.string.email_label)) },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = state.password,
            onValueChange = onPasswordChange,
            modifier = Modifier.fillMaxWidth(),
            enabled = !state.isBusy,
            label = { Text(stringResource(R.string.password_label)) },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
            keyboardActions = KeyboardActions(onDone = { onSignIn() }),
        )
        Spacer(Modifier.height(12.dp))
        Text(
            text = state.errorMessage?.let { stringResource(it) }.orEmpty(),
            modifier = Modifier.fillMaxWidth(),
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodySmall,
            minLines = 1,
        )
        Spacer(Modifier.height(24.dp))
        BaseButton(
            text = stringResource(R.string.sign_in),
            onClick = onSignIn,
            modifier = Modifier.fillMaxWidth(),
            enabled = state.canSubmitEmail && !state.isBusy,
            isBusy = state.busyMethod == SignInMethod.Email,
        )
        Spacer(Modifier.height(24.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            HorizontalDivider(Modifier.weight(1f))
            Text(
                text = stringResource(R.string.or_divider),
                modifier = Modifier.padding(horizontal = 16.dp),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            HorizontalDivider(Modifier.weight(1f))
        }
        Spacer(Modifier.height(24.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BrandGoogleIconButton(
                onClick = onGoogle,
                enabled = !state.isBusy,
                isBusy = state.busyMethod == SignInMethod.Google,
            )
            BrandPasskeyIconButton(
                onClick = onPasskey,
                enabled = !state.isBusy,
                isBusy = state.busyMethod == SignInMethod.Passkey,
            )
        }
    }
}

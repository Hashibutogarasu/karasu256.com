package com.karasu256.karasulab.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import com.karasu256.karasulab.R

private val GoogleContainerColor = Color(0xFFF2F2F2)

/**
 * Google's icon-only "Sign in with Google" button: the four-color Google logo on a light gray circle.
 *
 * @param onClick called when the button is clicked.
 * @param modifier modifier applied to the button.
 * @param enabled whether the button can be clicked when not busy.
 * @param isBusy whether the sign-in is in progress.
 */
@Composable
fun BrandGoogleIconButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isBusy: Boolean = false,
) {
    BrandIconButton(
        onClick = onClick,
        containerColor = GoogleContainerColor,
        contentDescription = stringResource(R.string.continue_with_google),
        modifier = modifier,
        enabled = enabled,
        isBusy = isBusy,
    ) {
        Image(
            painter = painterResource(R.drawable.ic_google_logo),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
        )
    }
}

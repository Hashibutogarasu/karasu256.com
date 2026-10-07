package com.karasu256.karasulab.ui.components

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import com.karasu256.karasulab.R

/**
 * An icon-only passkey sign-in button shaped like [BrandGoogleIconButton]: a fingerprint icon on a white circle.
 *
 * @param onClick called when the button is clicked.
 * @param modifier modifier applied to the button.
 * @param enabled whether the button can be clicked when not busy.
 * @param isBusy whether the sign-in is in progress.
 */
@Composable
fun BrandPasskeyIconButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isBusy: Boolean = false,
) {
    BrandIconButton(
        onClick = onClick,
        containerColor = Color.White,
        contentDescription = stringResource(R.string.sign_in_with_passkey),
        modifier = modifier,
        enabled = enabled,
        isBusy = isBusy,
    ) {
        Icon(
            painter = painterResource(R.drawable.ic_fingerprint),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            tint = BrandIconButtonContentColor,
        )
    }
}

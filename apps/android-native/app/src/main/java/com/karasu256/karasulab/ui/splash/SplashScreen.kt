package com.karasu256.karasulab.ui.splash

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalFontFamilyResolver
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import com.karasu256.karasulab.R
import com.karasu256.karasulab.ui.theme.preloadAppFonts
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private const val FADE_DURATION_MS = 500
private const val STAGGER_MS = 300L

/**
 * Shows `Karasu` and `LAB` stacked in the center while the app's fonts load.
 *
 * `Karasu` fades in first and `LAB` 0.3 seconds later. Once both are shown and the fonts have loaded,
 * `LAB` fades out first and `Karasu` 0.3 seconds later, then [onFinished] is called. The logo uses the
 * system font, since the app's fonts are not available until this screen finishes.
 */
@Composable
fun SplashScreen(onFinished: () -> Unit) {
    val karasuAlpha = remember { Animatable(0f) }
    val labAlpha = remember { Animatable(0f) }
    val fontFamilyResolver = LocalFontFamilyResolver.current
    val currentOnFinished by rememberUpdatedState(onFinished)

    LaunchedEffect(Unit) {
        coroutineScope {
            launch { karasuAlpha.animateTo(1f, tween(FADE_DURATION_MS)) }
            launch {
                delay(STAGGER_MS)
                labAlpha.animateTo(1f, tween(FADE_DURATION_MS))
            }
            launch { fontFamilyResolver.preloadAppFonts() }
        }
        coroutineScope {
            launch { labAlpha.animateTo(0f, tween(FADE_DURATION_MS)) }
            launch {
                delay(STAGGER_MS)
                karasuAlpha.animateTo(0f, tween(FADE_DURATION_MS))
            }
        }
        currentOnFinished()
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = stringResource(R.string.splash_karasu),
            modifier = Modifier.graphicsLayer { alpha = karasuAlpha.value },
            style = MaterialTheme.typography.displayMedium.copy(fontFamily = FontFamily.Default),
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = stringResource(R.string.splash_lab),
            modifier = Modifier.graphicsLayer { alpha = labAlpha.value },
            style = MaterialTheme.typography.titleLarge.copy(fontFamily = FontFamily.Default),
            color = MaterialTheme.colorScheme.primary,
        )
    }
}

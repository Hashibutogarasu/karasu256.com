package com.karasu256.karasulab.ui.auth

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.unit.dp

/**
 * Small text at the bottom of the auth screen showing the API host, the authentication server host and
 * the connected branch as bare values. A ghost of those lines pulses until [state] is loaded.
 *
 * @param state where the connection info stands.
 * @param modifier modifier applied to the footer.
 */
@Composable
fun ConnectionFooter(state: ConnectionState, modifier: Modifier = Modifier) {
    Crossfade(targetState = state, modifier = modifier, label = "connectionFooter") { current ->
        when (current) {
            ConnectionState.Loading -> ConnectionGhost()
            is ConnectionState.Loaded -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                listOfNotNull(current.info.apiHost, current.info.authHost, current.info.branch).forEach { line ->
                    Text(
                        text = line,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

/** Pulsing placeholder bars standing in for the connection lines while they load. */
@Composable
private fun ConnectionGhost() {
    val alpha by rememberInfiniteTransition(label = "ghost").animateFloat(
        initialValue = 0.2f,
        targetValue = 0.6f,
        animationSpec = infiniteRepeatable(tween(durationMillis = 800), RepeatMode.Reverse),
        label = "ghostAlpha",
    )
    Column(
        modifier = Modifier.alpha(alpha),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        listOf(120.dp, 144.dp, 72.dp).forEachIndexed { index, barWidth ->
            if (index > 0) Spacer(Modifier.height(4.dp))
            Spacer(
                Modifier
                    .width(barWidth)
                    .height(10.dp)
                    .background(MaterialTheme.colorScheme.onSurfaceVariant, RoundedCornerShape(percent = 50)),
            )
        }
    }
}

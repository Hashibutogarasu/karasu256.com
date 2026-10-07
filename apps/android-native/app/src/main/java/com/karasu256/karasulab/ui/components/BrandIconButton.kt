package com.karasu256.karasulab.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

private const val TRANSITION_MS = 218
internal val BrandIconButtonContentColor = Color(0xFF1F1F1F)
private val StateLayerColor = Color(0xFF001D35)
private val DisabledContainerColor = Color(0x61FFFFFF)
private val DisabledStateLayerColor = Color(0xFF1F1F1F)

/**
 * A 40dp round, icon-only sign-in button following Google's Material sign-in button.
 *
 * Pressing or focusing it lays a 12% state layer over the container and hovering lays an 8% one with a
 * shadow. While disabled or [isBusy] it switches to the disabled colors, and while [isBusy] its icon turns
 * into a circular progress indicator.
 *
 * @param onClick called when the button is clicked.
 * @param containerColor fill color while enabled.
 * @param contentDescription accessibility label describing the action.
 * @param modifier modifier applied to the button.
 * @param enabled whether the button can be clicked when not busy.
 * @param isBusy whether the action is in progress.
 * @param icon the 20dp icon drawn in the center.
 */
@Composable
internal fun BrandIconButton(
    onClick: () -> Unit,
    containerColor: Color,
    contentDescription: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isBusy: Boolean = false,
    icon: @Composable () -> Unit,
) {
    val active = enabled && !isBusy
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val isFocused by interactionSource.collectIsFocusedAsState()
    val isHovered by interactionSource.collectIsHoveredAsState()

    val container by animateColorAsState(
        targetValue = if (active) containerColor else DisabledContainerColor,
        animationSpec = tween(TRANSITION_MS),
    )
    val stateLayerAlpha by animateFloatAsState(
        targetValue = when {
            !active -> 0.12f
            isPressed || isFocused -> 0.12f
            isHovered -> 0.08f
            else -> 0f
        },
        animationSpec = tween(TRANSITION_MS),
    )
    val elevation by animateDpAsState(
        targetValue = if (active && isHovered) 2.dp else 0.dp,
        animationSpec = tween(TRANSITION_MS),
    )
    val contentAlpha by animateFloatAsState(
        targetValue = if (active) 1f else 0.38f,
        animationSpec = tween(TRANSITION_MS),
    )

    Box(
        modifier = modifier
            .minimumInteractiveComponentSize()
            .size(40.dp)
            .shadow(elevation, CircleShape)
            .clip(CircleShape)
            .background(container)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                enabled = active,
                role = Role.Button,
                onClick = onClick,
            )
            .semantics { this.contentDescription = contentDescription },
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .matchParentSize()
                .background((if (active) StateLayerColor else DisabledStateLayerColor).copy(alpha = stateLayerAlpha)),
        )
        AnimatedContent(
            targetState = isBusy,
            modifier = Modifier.alpha(contentAlpha),
            transitionSpec = { fadeIn() togetherWith fadeOut() },
        ) { busy ->
            Box(modifier = Modifier.size(20.dp), contentAlignment = Alignment.Center) {
                if (busy) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        color = BrandIconButtonContentColor,
                        strokeWidth = 2.dp,
                    )
                } else {
                    icon()
                }
            }
        }
    }
}

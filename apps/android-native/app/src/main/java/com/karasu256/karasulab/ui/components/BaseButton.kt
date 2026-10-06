package com.karasu256.karasulab.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Visual variants of [BaseButton]. */
enum class BaseButtonStyle {
    /** Solid primary-colored button for the main action. */
    Filled,

    /** Transparent button with an outline for secondary actions. */
    Outlined,
}

/**
 * The app's base button: fully rounded, and able to show progress in place of its label.
 *
 * While [isBusy] is true the button fades from its enabled to its disabled colors and its label
 * turns into a circular progress indicator.
 *
 * @param text label shown while not busy.
 * @param onClick called when the button is clicked.
 * @param modifier modifier applied to the button.
 * @param enabled whether the button can be clicked when not busy.
 * @param isBusy whether the action is in progress.
 * @param style visual variant.
 */
@Composable
fun BaseButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isBusy: Boolean = false,
    style: BaseButtonStyle = BaseButtonStyle.Filled,
) {
    val active = enabled && !isBusy
    val colors = MaterialTheme.colorScheme
    val disabledContainer = colors.onSurface.copy(alpha = 0.12f)
    val disabledContent = colors.onSurface.copy(alpha = 0.38f)
    val containerColor by animateColorAsState(
        targetValue = when {
            style == BaseButtonStyle.Outlined -> Color.Transparent
            active -> colors.primary
            else -> disabledContainer
        },
        label = "containerColor",
    )
    val contentColor by animateColorAsState(
        targetValue = when {
            !active -> disabledContent
            style == BaseButtonStyle.Filled -> colors.onPrimary
            else -> colors.primary
        },
        label = "contentColor",
    )
    val borderColor by animateColorAsState(
        targetValue = if (active) colors.outline else disabledContainer,
        label = "borderColor",
    )
    Button(
        onClick = onClick,
        modifier = modifier.heightIn(min = 48.dp),
        enabled = active,
        shape = RoundedCornerShape(percent = 50),
        colors = ButtonDefaults.buttonColors(
            containerColor = containerColor,
            contentColor = contentColor,
            disabledContainerColor = containerColor,
            disabledContentColor = contentColor,
        ),
        border = if (style == BaseButtonStyle.Outlined) BorderStroke(1.dp, borderColor) else null,
    ) {
        AnimatedContent(
            targetState = isBusy,
            transitionSpec = { fadeIn() togetherWith fadeOut() },
            label = "busyContent",
        ) { busy ->
            if (busy) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = contentColor,
                    strokeWidth = 2.dp,
                )
            } else {
                Text(text = text)
            }
        }
    }
}

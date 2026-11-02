package com.tomsapphire.docscan.ui.theme

import android.app.UiModeManager
import android.content.Context
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalInspectionMode

/** Contrast levels Android 14+ lets the user choose in accessibility settings. */
enum class ContrastLevel { Standard, Medium, High }

@Composable
fun DocScanTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    /** Wallpaper-based color on Android 12+. Turned off for screenshots so they are stable. */
    dynamicColor: Boolean = !LocalInspectionMode.current,
    contrast: ContrastLevel? = null,
    content: @Composable () -> Unit,
) {
    val context = LocalContext.current
    val resolvedContrast = contrast ?: remember(context) { systemContrast(context) }
    val colorScheme = when {
        // Dynamic schemes already honour the system contrast setting.
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        else -> brandScheme(darkTheme, resolvedContrast)
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = DocScanTypography,
        shapes = DocScanShapes,
        content = content,
    )
}

internal fun brandScheme(darkTheme: Boolean, contrast: ContrastLevel): ColorScheme = when (contrast) {
    ContrastLevel.Standard -> if (darkTheme) darkScheme else lightScheme
    ContrastLevel.Medium -> if (darkTheme) darkMediumContrastScheme else lightMediumContrastScheme
    ContrastLevel.High -> if (darkTheme) darkHighContrastScheme else lightHighContrastScheme
}

private fun systemContrast(context: Context): ContrastLevel {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return ContrastLevel.Standard
    val contrast = context.getSystemService(UiModeManager::class.java)?.contrast ?: 0f
    return when {
        contrast >= 1f -> ContrastLevel.High
        contrast >= 0.5f -> ContrastLevel.Medium
        else -> ContrastLevel.Standard
    }
}

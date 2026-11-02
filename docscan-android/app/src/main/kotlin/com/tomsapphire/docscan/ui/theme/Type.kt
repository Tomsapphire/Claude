package com.tomsapphire.docscan.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.em
import com.tomsapphire.docscan.R

/**
 * Rubik is a variable font that covers both Latin and Hebrew, so English and Hebrew
 * screens share one voice. Each weight is an instance of the same file.
 */
private fun rubik(weight: FontWeight) = Font(
    resId = R.font.rubik,
    weight = weight,
    variationSettings = FontVariation.Settings(FontVariation.weight(weight.weight)),
)

val Rubik = FontFamily(
    rubik(FontWeight.Light),
    rubik(FontWeight.Normal),
    rubik(FontWeight.Medium),
    rubik(FontWeight.SemiBold),
    rubik(FontWeight.Bold),
)

private val Base = Typography()

private fun TextStyle.rubik(weight: FontWeight, letterSpacing: Float? = null) = copy(
    fontFamily = Rubik,
    fontWeight = weight,
    letterSpacing = letterSpacing?.em ?: this.letterSpacing,
)

/**
 * The Material 3 type scale in Rubik. Display and headline styles are heavier and
 * slightly tighter than the baseline for a bolder, more expressive hierarchy.
 */
val DocScanTypography = Typography(
    displayLarge = Base.displayLarge.rubik(FontWeight.SemiBold, letterSpacing = -0.02f),
    displayMedium = Base.displayMedium.rubik(FontWeight.SemiBold, letterSpacing = -0.015f),
    displaySmall = Base.displaySmall.rubik(FontWeight.SemiBold, letterSpacing = -0.01f),
    headlineLarge = Base.headlineLarge.rubik(FontWeight.SemiBold, letterSpacing = -0.01f),
    headlineMedium = Base.headlineMedium.rubik(FontWeight.SemiBold),
    headlineSmall = Base.headlineSmall.rubik(FontWeight.Medium),
    titleLarge = Base.titleLarge.rubik(FontWeight.Medium),
    titleMedium = Base.titleMedium.rubik(FontWeight.Medium),
    titleSmall = Base.titleSmall.rubik(FontWeight.Medium),
    bodyLarge = Base.bodyLarge.rubik(FontWeight.Normal),
    bodyMedium = Base.bodyMedium.rubik(FontWeight.Normal),
    bodySmall = Base.bodySmall.rubik(FontWeight.Normal),
    labelLarge = Base.labelLarge.rubik(FontWeight.Medium),
    labelMedium = Base.labelMedium.rubik(FontWeight.Medium),
    labelSmall = Base.labelSmall.rubik(FontWeight.Medium),
)

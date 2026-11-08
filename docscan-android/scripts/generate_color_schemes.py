"""Regenerates app/src/main/kotlin/.../ui/theme/ColorSchemes.kt from a seed colour.

The brand scheme is used when dynamic colour is unavailable (Android 11 and older) and
comes in standard, medium and high contrast, light and dark.

    python3 -m venv .venv && .venv/bin/pip install materialyoucolor
    .venv/bin/python scripts/generate_color_schemes.py 2F5DA8 > \
        app/src/main/kotlin/com/tomsapphire/docscan/ui/theme/ColorSchemes.kt
"""
import sys

from materialyoucolor.dynamiccolor.material_dynamic_colors import MaterialDynamicColors as M
from materialyoucolor.hct import Hct
from materialyoucolor.scheme.scheme_content import SchemeContent

ROLES = [
    "primary", "onPrimary", "primaryContainer", "onPrimaryContainer", "inversePrimary",
    "secondary", "onSecondary", "secondaryContainer", "onSecondaryContainer",
    "tertiary", "onTertiary", "tertiaryContainer", "onTertiaryContainer",
    "background", "onBackground", "surface", "onSurface", "surfaceVariant", "onSurfaceVariant",
    "surfaceTint", "inverseSurface", "inverseOnSurface", "error", "onError", "errorContainer",
    "onErrorContainer", "outline", "outlineVariant", "scrim", "surfaceBright", "surfaceContainer",
    "surfaceContainerHigh", "surfaceContainerHighest", "surfaceContainerLow",
    "surfaceContainerLowest", "surfaceDim",
    "primaryFixed", "primaryFixedDim", "onPrimaryFixed", "onPrimaryFixedVariant",
    "secondaryFixed", "secondaryFixedDim", "onSecondaryFixed", "onSecondaryFixedVariant",
    "tertiaryFixed", "tertiaryFixedDim", "onTertiaryFixed", "onTertiaryFixedVariant",
]

SCHEMES = {
    (False, 0.0): "lightScheme",
    (True, 0.0): "darkScheme",
    (False, 0.5): "lightMediumContrastScheme",
    (True, 0.5): "darkMediumContrastScheme",
    (False, 1.0): "lightHighContrastScheme",
    (True, 1.0): "darkHighContrastScheme",
}


def main(seed_hex: str) -> None:
    seed = int(seed_hex.lstrip("#"), 16) | 0xFF000000
    out = [
        "// Generated from seed #%06X with Material Color Utilities (content scheme). "
        "Do not edit by hand." % (seed & 0xFFFFFF),
        "package com.tomsapphire.docscan.ui.theme",
        "",
        "import androidx.compose.material3.darkColorScheme",
        "import androidx.compose.material3.lightColorScheme",
        "import androidx.compose.ui.graphics.Color",
        "",
    ]
    for (dark, contrast), name in SCHEMES.items():
        scheme = SchemeContent(Hct.from_int(seed), dark, contrast)
        out.append(f"internal val {name} = {'darkColorScheme' if dark else 'lightColorScheme'}(")
        for role in ROLES:
            argb = getattr(M, role).get_argb(scheme) & 0xFFFFFFFF
            out.append(f"    {role} = Color(0x{argb:08X}),")
        out.append(")")
        out.append("")
    print("\n".join(out))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "2F5DA8")

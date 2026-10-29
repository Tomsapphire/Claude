import type { TextStyle } from 'react-native';

/** Font family names as registered with expo-font in `src/features/boot/boot.ts`. */
export const fontFamilies = {
  displayBold: 'BarlowCondensed_700Bold',
  displayHeavy: 'BarlowCondensed_800ExtraBold',
} as const;

export type TextVariant =
  'display' | 'h1' | 'h2' | 'title' | 'body' | 'bodySmall' | 'label' | 'caption';

interface VariantSpec {
  style: TextStyle;
  /** Caps Dynamic Type scaling so large headings never break layouts. */
  maxFontSizeMultiplier: number;
}

/**
 * Condensed display face for headings and numbers (they fit large sizes in narrow space),
 * system face for running text (best legibility at small sizes).
 */
export const textVariants: Record<TextVariant, VariantSpec> = {
  display: {
    style: { fontFamily: fontFamilies.displayHeavy, fontSize: 56, lineHeight: 58 },
    maxFontSizeMultiplier: 1.1,
  },
  h1: {
    style: {
      fontFamily: fontFamilies.displayBold,
      fontSize: 36,
      lineHeight: 40,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    maxFontSizeMultiplier: 1.2,
  },
  h2: {
    style: {
      fontFamily: fontFamilies.displayBold,
      fontSize: 24,
      lineHeight: 28,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    maxFontSizeMultiplier: 1.3,
  },
  title: {
    style: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
    maxFontSizeMultiplier: 1.4,
  },
  body: {
    style: { fontSize: 17, lineHeight: 24 },
    maxFontSizeMultiplier: 1.5,
  },
  bodySmall: {
    style: { fontSize: 15, lineHeight: 21 },
    maxFontSizeMultiplier: 1.5,
  },
  label: {
    style: {
      fontFamily: fontFamilies.displayBold,
      fontSize: 14,
      lineHeight: 18,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    maxFontSizeMultiplier: 1.4,
  },
  caption: {
    style: { fontSize: 13, lineHeight: 18 },
    maxFontSizeMultiplier: 1.5,
  },
};

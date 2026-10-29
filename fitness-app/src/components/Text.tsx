import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, textVariants, type TextVariant } from '@/theme';

export type TextTone = 'default' | 'muted' | 'faint' | 'accent' | 'danger' | 'success' | 'onAccent';

const toneColors: Record<TextTone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  faint: colors.textFaint,
  accent: colors.accent,
  danger: colors.danger,
  success: colors.success,
  onAccent: colors.onAccent,
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
}

export function Text({
  variant = 'body',
  tone = 'default',
  align,
  style,
  maxFontSizeMultiplier,
  ...rest
}: TextProps) {
  const spec = textVariants[variant];
  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? spec.maxFontSizeMultiplier}
      style={[spec.style, { color: toneColors[tone] }, align && { textAlign: align }, style]}
      {...rest}
    />
  );
}

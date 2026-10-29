import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { colors, fontFamilies, minTouchTarget, radii, spacing } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
}

const palette: Record<ButtonVariant, { bg: string; pressed: string; fg: string; border: string }> =
  {
    primary: {
      bg: colors.accent,
      pressed: colors.accentPressed,
      fg: colors.onAccent,
      border: colors.accent,
    },
    secondary: {
      bg: colors.surfaceRaised,
      pressed: colors.border,
      fg: colors.text,
      border: colors.border,
    },
    ghost: { bg: 'transparent', pressed: colors.surface, fg: colors.text, border: 'transparent' },
    danger: {
      bg: 'transparent',
      pressed: 'rgba(255, 69, 58, 0.12)',
      fg: colors.danger,
      border: colors.danger,
    },
  };

const heights: Record<ButtonSize, number> = { md: 52, lg: 64 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  accessibilityHint,
}: ButtonProps) {
  const colorsFor = palette[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: Math.max(heights[size], minTouchTarget),
          backgroundColor: pressed ? colorsFor.pressed : colorsFor.bg,
          borderColor: colorsFor.border,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colorsFor.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={size === 'lg' ? 24 : 20} color={colorsFor.fg} /> : null}
          <Text
            style={[styles.label, { color: colorsFor.fg, fontSize: size === 'lg' ? 22 : 18 }]}
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontFamily: fontFamilies.displayBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

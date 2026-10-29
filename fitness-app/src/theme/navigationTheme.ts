import { DarkTheme, type NativeStackNavigationOptions, type Theme } from 'expo-router';

import { colors } from './tokens';
import { fontFamilies } from './typography';

/** Navigation chrome colours, so headers and transitions never flash white. */
export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

/** Shared options for the stack inside each tab. Root screens draw their own large header. */
export const tabStackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.bg },
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.accent,
  headerTitleStyle: { fontFamily: fontFamilies.displayBold, fontSize: 20, color: colors.text },
  headerShadowVisible: false,
};

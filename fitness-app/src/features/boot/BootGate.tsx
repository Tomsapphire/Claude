import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { bootApp } from './boot';

// Keep the native splash up until fonts and the database are ready.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden (e.g. after a fast refresh). Nothing to do.
});

type BootState =
  | { status: 'loading'; attempt: number }
  | { status: 'ready' }
  | { status: 'error'; attempt: number; message: string };

/** Renders children only once the app has booted. Shows a retryable error if boot fails. */
export function BootGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BootState>({ status: 'loading', attempt: 0 });
  const splashHidden = useRef(false);
  const attempt = state.status === 'ready' ? null : state.attempt;
  const isLoading = state.status === 'loading';

  useEffect(() => {
    if (!isLoading || attempt === null) return;
    let cancelled = false;
    bootApp()
      .then(() => {
        if (!cancelled) setState({ status: 'ready' });
      })
      .catch((error: unknown) => {
        console.error('Boot failed', error);
        if (!cancelled) {
          setState({
            status: 'error',
            attempt,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isLoading, attempt]);

  useEffect(() => {
    if (state.status !== 'loading' && !splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [state.status]);

  if (state.status === 'ready') return children;

  if (state.status === 'loading') {
    // First attempt: the native splash covers this. Retries: show a spinner.
    return (
      <View style={styles.centered}>
        {state.attempt > 0 ? <ActivityIndicator color={colors.accent} size="large" /> : null}
      </View>
    );
  }

  const retry = () => setState({ status: 'loading', attempt: state.attempt + 1 });

  // Deliberately uses system fonts only: custom fonts may be what failed to load.
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Couldn&apos;t start the app</Text>
      <Text style={styles.message}>
        Your data is safe. Try again, and if this keeps happening, restart the app.
      </Text>
      <Text style={styles.detail}>{state.message}</Text>
      <Pressable
        onPress={retry}
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonLabel}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  detail: {
    color: colors.textFaint,
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.accentPressed,
  },
  buttonLabel: {
    color: colors.onAccent,
    fontSize: 18,
    fontWeight: '700',
  },
});

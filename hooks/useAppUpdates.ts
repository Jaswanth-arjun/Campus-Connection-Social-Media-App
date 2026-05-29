import { useEffect, useState, useCallback } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import * as Updates from 'expo-updates';

interface UpdateState {
  /** Whether we're currently checking for an update */
  isChecking: boolean;
  /** Whether an update is being downloaded */
  isDownloading: boolean;
  /** Whether an update is available and ready to apply */
  isReady: boolean;
  /** Last error message */
  error: string | null;
  /** The last time we checked for updates */
  lastChecked: Date | null;
}

/**
 * Hook that manages OTA (Over-The-Air) updates via expo-updates.
 * 
 * Features:
 * - Auto-checks for updates on app launch
 * - Re-checks when app comes to foreground
 * - Provides manual check/apply functions
 * - Shows user-friendly alerts for update flow
 * 
 * Usage:
 * ```tsx
 * const { checkForUpdate, isChecking, isDownloading } = useAppUpdates();
 * ```
 */
export function useAppUpdates() {
  const [state, setState] = useState<UpdateState>({
    isChecking: false,
    isDownloading: false,
    isReady: false,
    error: null,
    lastChecked: null,
  });

  /**
   * Check for available updates and download if found.
   * Optionally show an alert prompting the user to restart.
   */
  const checkForUpdate = useCallback(async (showAlertIfNone = false) => {
    // expo-updates doesn't work in Expo Go / development mode
    if (__DEV__) {
      console.log('[Updates] Skipping update check in development mode');
      if (showAlertIfNone) {
        Alert.alert(
          'Development Mode',
          'OTA updates are not available in development mode. They work only in built APKs (preview/production builds).',
        );
      }
      return;
    }

    try {
      setState(prev => ({ ...prev, isChecking: true, error: null }));

      const checkResult = await Updates.checkForUpdateAsync();

      if (checkResult.isAvailable) {
        console.log('[Updates] Update available! Downloading...');
        setState(prev => ({ ...prev, isChecking: false, isDownloading: true }));

        const fetchResult = await Updates.fetchUpdateAsync();

        if (fetchResult.isNew) {
          setState(prev => ({
            ...prev,
            isDownloading: false,
            isReady: true,
            lastChecked: new Date(),
          }));

          // Ask user to restart
          Alert.alert(
            '🎉 Update Available!',
            'A new version of Campus Connect has been downloaded. Restart now to apply the update.',
            [
              {
                text: 'Later',
                style: 'cancel',
                onPress: () => console.log('[Updates] User deferred restart'),
              },
              {
                text: 'Restart Now',
                style: 'default',
                onPress: async () => {
                  try {
                    await Updates.reloadAsync();
                  } catch (e) {
                    console.error('[Updates] Failed to reload:', e);
                  }
                },
              },
            ],
          );
        }
      } else {
        setState(prev => ({
          ...prev,
          isChecking: false,
          isDownloading: false,
          lastChecked: new Date(),
        }));

        if (showAlertIfNone) {
          Alert.alert(
            '✅ Up to Date',
            'You are running the latest version of Campus Connect.',
          );
        }
        console.log('[Updates] App is up to date');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error checking for updates';
      console.error('[Updates] Error:', errorMessage);

      setState(prev => ({
        ...prev,
        isChecking: false,
        isDownloading: false,
        error: errorMessage,
        lastChecked: new Date(),
      }));

      if (showAlertIfNone) {
        Alert.alert(
          'Update Check Failed',
          `Could not check for updates: ${errorMessage}`,
        );
      }
    }
  }, []);

  /**
   * Force apply a downloaded update by reloading the app.
   */
  const applyUpdate = useCallback(async () => {
    if (!__DEV__) {
      try {
        await Updates.reloadAsync();
      } catch (e) {
        console.error('[Updates] Failed to apply update:', e);
      }
    }
  }, []);

  // Auto-check on mount (app launch)
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdate(false);
    }, 3000); // Wait 3s after launch to avoid blocking UI

    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  // Re-check when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkForUpdate(false);
      }
    });

    return () => subscription.remove();
  }, [checkForUpdate]);

  return {
    ...state,
    checkForUpdate,
    applyUpdate,
    /** Current update channel info */
    channel: Updates.channel ?? 'default',
    /** Current runtime version */
    runtimeVersion: Updates.runtimeVersion ?? 'unknown',
    /** Whether updates are enabled (false in dev mode) */
    isEnabled: !__DEV__,
  };
}

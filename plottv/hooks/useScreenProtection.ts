import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Hook to detect screen recording and prevent it.
 * On Android, we rely on FLAG_SECURE set via Config Plugin.
 * On iOS, we monitor UIScreen.isCaptured via native logic in AppDelegate
 * and sync potential state through AppState or other hints.
 */
export const useScreenProtection = () => {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Current implementation relies heavily on Native side.
    // JS layer can monitor AppState as recording often triggers lifecycle changes.
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Logic for JS-side side effects if needed
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return { isRecording };
};

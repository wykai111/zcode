import { useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { storage } from '@/utils/storage';

export const DICTIONARY_UPDATE_EVENT = 'DICTIONARY_UPDATE_EVENT';

export function useDictionary() {
  const [dict, setDict] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initial load
    const loadDict = async () => {
      const storedDict = await storage.getDictionary();
      if (storedDict) {
        setDict(storedDict);
      }
    };
    loadDict();

    // Listen for updates
    const subscription = DeviceEventEmitter.addListener(DICTIONARY_UPDATE_EVENT, (newDict: Record<string, string>) => {
      setDict(newDict);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return dict;
}

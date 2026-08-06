// Safe cross-platform storage for Expo Go (Android, iOS & Web)
// Handles native module null errors gracefully with in-memory fallback

const inMemoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        const val = await AsyncStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {
      // Catches Expo Go Native module is null error
    }
    return inMemoryStore[key] || null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    inMemoryStore[key] = value;
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, value);
      }
    } catch (e) {
      // Catches Expo Go Native module is null error
    }
  },

  removeItem: async (key: string): Promise<void> => {
    delete inMemoryStore[key];
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      // Catches Expo Go Native module is null error
    }
  },
};

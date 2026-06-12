import * as SecureStore from "expo-secure-store";

const isBrowser = typeof window !== "undefined";
const hasLocalStorage = isBrowser && typeof window.localStorage !== "undefined";

/** Persists small strings: localStorage on web, SecureStore on native. */
export const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    if (hasLocalStorage) {
      return window.localStorage.getItem(key);
    }

    if (typeof SecureStore.getItemAsync === "function") {
      return SecureStore.getItemAsync(key);
    }

    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (hasLocalStorage) {
      window.localStorage.setItem(key, value);
      return;
    }

    if (typeof SecureStore.setItemAsync === "function") {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (hasLocalStorage) {
      window.localStorage.removeItem(key);
      return;
    }

    if (typeof SecureStore.deleteItemAsync === "function") {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

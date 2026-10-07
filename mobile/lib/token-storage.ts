import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Session token persistence.
 *
 * Native builds use SecureStore (Keychain / Keystore). expo-secure-store has
 * no web implementation, so the web build (used for local preview and demo
 * only) falls back to localStorage. localStorage is readable by any script on
 * the origin, so the web target must not be treated as a production client.
 *
 * The web build also needs its own API base URL: an Android emulator reaches
 * the host at 10.0.2.2, which does not resolve in a browser. Set
 * EXPO_PUBLIC_API_URL=http://localhost:3000 when previewing on web.
 */
const isWeb = Platform.OS === 'web';

export function getToken(key: string): Promise<string | null> {
  if (isWeb) {
    return Promise.resolve(globalThis.localStorage?.getItem(key) ?? null);
  }
  return SecureStore.getItemAsync(key);
}

export function setToken(key: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return Promise.resolve();
  }
  return SecureStore.setItemAsync(key, value);
}

export function deleteToken(key: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(key);
    return Promise.resolve();
  }
  return SecureStore.deleteItemAsync(key);
}

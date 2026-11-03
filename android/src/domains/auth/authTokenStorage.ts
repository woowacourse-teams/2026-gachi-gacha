import * as SecureStore from 'expo-secure-store';

import { createAuthTokenPersistence } from './authTokenPersistence';
import { AUTH_SESSION_KEY } from './authStorageKeys';

const persistence = createAuthTokenPersistence({
  read: () => SecureStore.getItemAsync(AUTH_SESSION_KEY),
  write: (value) => SecureStore.setItemAsync(AUTH_SESSION_KEY, value),
  remove: () => SecureStore.deleteItemAsync(AUTH_SESSION_KEY),
});

export const readAuthTokens = persistence.read;
export const storeAuthTokens = persistence.store;
export const updateStoredRefreshToken = persistence.updateRefreshToken;
export const clearAuthTokens = persistence.clear;
export const subscribeAuthTokens = persistence.subscribe;

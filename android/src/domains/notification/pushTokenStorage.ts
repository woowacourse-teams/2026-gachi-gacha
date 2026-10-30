import * as SecureStore from 'expo-secure-store';

const PUSH_TOKEN_STORAGE_KEY = 'gachigacha_push_token';

export async function readStoredPushToken(): Promise<string | null> {
  const token = (await SecureStore.getItemAsync(PUSH_TOKEN_STORAGE_KEY))?.trim();
  return token || null;
}

export async function storePushToken(token: string): Promise<void> {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    throw new Error('저장할 푸시 토큰이 올바르지 않습니다.');
  }

  await SecureStore.setItemAsync(PUSH_TOKEN_STORAGE_KEY, normalizedToken);
}

export async function clearStoredPushToken(): Promise<void> {
  await SecureStore.deleteItemAsync(PUSH_TOKEN_STORAGE_KEY);
}

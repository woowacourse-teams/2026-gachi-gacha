import {
  CryptoDigestAlgorithm,
  CryptoEncoding,
  digestStringAsync,
  getRandomBytesAsync,
} from 'expo-crypto';

export type OAuthPkcePair = {
  challenge: string;
  verifier: string;
};

const BASE64_URL_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function encodeBase64Url(bytes: Uint8Array): string {
  let result = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const block =
      (first << 16) | ((second ?? 0) << 8) | (third ?? 0);

    result += BASE64_URL_ALPHABET[(block >> 18) & 63];
    result += BASE64_URL_ALPHABET[(block >> 12) & 63];

    if (second !== undefined) {
      result += BASE64_URL_ALPHABET[(block >> 6) & 63];
    }

    if (third !== undefined) {
      result += BASE64_URL_ALPHABET[block & 63];
    }
  }

  return result;
}

function toBase64Url(value: string): string {
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function createOAuthPkcePair(): Promise<OAuthPkcePair> {
  const verifier = encodeBase64Url(await getRandomBytesAsync(32));
  const challenge = toBase64Url(
    await digestStringAsync(CryptoDigestAlgorithm.SHA256, verifier, {
      encoding: CryptoEncoding.BASE64,
    }),
  );

  return { challenge, verifier };
}

import Constants from 'expo-constants';

export function isGoogleMapsConfigured(): boolean {
  return Constants.expoConfig?.extra?.googleMapsApiKeyConfigured === true;
}

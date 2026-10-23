import Constants from 'expo-constants';

export function areTradeFeaturesEnabled(): boolean {
  return Constants.expoConfig?.extra?.tradeFeaturesEnabled === true;
}

import Constants from 'expo-constants';

export function getMemberReportEndpoint(): string {
  return String(
    Constants.expoConfig?.extra?.memberReportEndpoint ?? '',
  ).trim();
}

export function getMemberSafetyEnvironment(): string {
  return String(Constants.expoConfig?.extra?.appVariant ?? 'unknown');
}

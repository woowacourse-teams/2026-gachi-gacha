import { Linking, Share } from 'react-native';

const PUBLIC_WEB_BASE_URL = 'https://gachigacha.kro.kr';

type SharePublicPageParams = {
  message: string;
  path: string;
  title: string;
};

export async function sharePublicPage({ message, path, title }: SharePublicPageParams): Promise<void> {
  const url = `${PUBLIC_WEB_BASE_URL}${path}`;

  await Share.share({
    title,
    message: `${message}\n${url}`,
    url,
  });
}

export async function openPhoneNumber(phoneNumber: string): Promise<void> {
  const normalizedPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
  if (!normalizedPhoneNumber) throw new Error('전화번호를 확인할 수 없습니다.');

  await Linking.openURL(`tel:${normalizedPhoneNumber}`);
}

type OpenDirectionsParams = {
  label: string;
  latitude: number;
  longitude: number;
};

export async function openDirections({ label, latitude, longitude }: OpenDirectionsParams): Promise<void> {
  const query = `${latitude},${longitude}(${label})`;

  try {
    await Linking.openURL(`geo:0,0?q=${encodeURIComponent(query)}`);
  } catch {
    await Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`,
    );
  }
}

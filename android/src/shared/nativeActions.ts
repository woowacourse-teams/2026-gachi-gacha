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
  try {
    await Linking.openURL(`kakaomap://look?p=${latitude},${longitude}`);
  } catch {
    await Linking.openURL(
      `https://map.kakao.com/link/map/${encodeURIComponent(label)},${latitude},${longitude}`,
    );
  }
}

export type InstagramProfile = {
  displayName: string;
  url: string;
};

export function createInstagramProfile(instagramId: string | null): InstagramProfile | null {
  const value = instagramId?.trim();
  if (!value) return null;

  const profileUrlMatch = value.match(
    /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)\/?(?:\?.*)?$/i,
  );
  const username = (profileUrlMatch?.[1] ?? value.replace(/^@/, '')).trim();

  if (username.length > 30 || !/^[a-zA-Z0-9._]+$/.test(username)) {
    return null;
  }

  return {
    displayName: `@${username}`,
    url: `https://www.instagram.com/${username}/`,
  };
}

export async function openInstagramProfile(profile: InstagramProfile): Promise<void> {
  await Linking.openURL(profile.url);
}

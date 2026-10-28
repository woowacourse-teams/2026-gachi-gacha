export const PUBLIC_WEB_BASE_URL = 'https://gachigacha.kro.kr';
export const PRIVACY_POLICY_URL = `${PUBLIC_WEB_BASE_URL}/privacy`;
export const ACCOUNT_DELETION_URL = `${PUBLIC_WEB_BASE_URL}/account-deletion`;
export const SUPPORT_INSTAGRAM_URL = 'https://www.instagram.com/gachi__.gacha/';

export type PublicWebFeature = 'privacyPolicy';

type PublicWebFeatureConfig = {
  allowedPathPrefixes: readonly string[];
  title: string;
  url: string;
};

const PUBLIC_WEB_FEATURES: Record<PublicWebFeature, PublicWebFeatureConfig> = {
  privacyPolicy: {
    allowedPathPrefixes: ['/privacy'],
    title: '개인정보처리방침',
    url: PRIVACY_POLICY_URL,
  },
};

export function getPublicWebFeature(feature: PublicWebFeature) {
  return PUBLIC_WEB_FEATURES[feature];
}

export function isAllowedPublicWebFeatureUrl(
  feature: PublicWebFeature,
  value: string,
) {
  if (value === 'about:blank') {
    return true;
  }

  try {
    const candidate = new URL(value);
    const publicWebOrigin = new URL(PUBLIC_WEB_BASE_URL).origin;
    const { allowedPathPrefixes } = getPublicWebFeature(feature);

    return (
      candidate.protocol === 'https:' &&
      candidate.origin === publicWebOrigin &&
      allowedPathPrefixes.some(
        (prefix) =>
          candidate.pathname === prefix ||
          candidate.pathname.startsWith(`${prefix}/`),
      )
    );
  } catch {
    return false;
  }
}

export function isPublicWebFeatureEntryUrl(
  feature: PublicWebFeature,
  value: string,
) {
  try {
    const candidate = new URL(value);
    const entry = new URL(getPublicWebFeature(feature).url);
    const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

    return (
      candidate.origin === entry.origin &&
      normalizePath(candidate.pathname) === normalizePath(entry.pathname)
    );
  } catch {
    return false;
  }
}

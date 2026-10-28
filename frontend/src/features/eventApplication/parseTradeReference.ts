export interface ParsedTradeReference {
  tradeId: number;
  tradeUrl: string;
}

const TRADE_PATH_PATTERN = /^\/trade\/([1-9]\d*)\/?$/;
const ALLOWED_HOSTNAMES = new Set([
  'gachigacha.kro.kr',
  'dev.gachigacha.kro.kr',
  'localhost',
]);

export function parseTradeReference(
  value: string,
  currentOrigin: string = window.location.origin,
): ParsedTradeReference | null {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  try {
    const url = new URL(normalizedValue, currentOrigin);
    const match = TRADE_PATH_PATTERN.exec(url.pathname);

    if (!ALLOWED_HOSTNAMES.has(url.hostname) || !match) {
      return null;
    }

    const tradeId = Number(match[1]);

    if (!Number.isSafeInteger(tradeId)) {
      return null;
    }

    url.search = '';
    url.hash = '';

    return {
      tradeId,
      tradeUrl: url.toString(),
    };
  } catch {
    return null;
  }
}

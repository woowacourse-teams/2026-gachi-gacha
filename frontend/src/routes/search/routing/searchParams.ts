const SELECTED_GACHA_PARAM = 'gachaId';

export function getSelectedGachaId(search: string): number | null {
  const searchParams = new URLSearchParams(search);
  const value = searchParams.get(SELECTED_GACHA_PARAM);

  if (value === null || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const gachaId = Number(value);

  return Number.isSafeInteger(gachaId) ? gachaId : null;
}

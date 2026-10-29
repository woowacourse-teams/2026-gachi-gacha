export function getKakaoPlaceSearchFailureMessage(status: number): string {
  if (status === 401 || status === 403) {
    return '지금은 장소 검색을 사용할 수 없어요. 잠시 후 다시 시도해 주세요.';
  }

  if (status === 429) {
    return '장소 검색 요청이 많아요. 잠시 후 다시 시도해 주세요.';
  }

  return '장소를 검색하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

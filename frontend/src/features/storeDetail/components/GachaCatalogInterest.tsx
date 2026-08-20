import * as S from './StoreDetailSheet.styles';
import { useGachaCatalogInterest } from '../hooks/useGachaCatalogInterest';
import type { BottomSheetState } from '../model/storeDetail';

interface GachaCatalogInterestProps {
  state: BottomSheetState;
  storeId: number;
  storeName: string;
}

export default function GachaCatalogInterest({
  state,
  storeId,
  storeName,
}: GachaCatalogInterestProps) {
  const { isInterested, requestInterest } = useGachaCatalogInterest(
    storeId,
    storeName,
  );

  return (
    <S.GachaInterestCard $state={state}>
      <S.GachaInterestMark aria-hidden="true">♡</S.GachaInterestMark>
      <S.GachaInterestCopy aria-live="polite">
        <S.GachaInterestTitle>
          {isInterested ? '관심 요청이 기록됐어요' : '아직 가챠 목록이 없어요'}
        </S.GachaInterestTitle>
        <S.GachaInterestDescription>
          {isInterested
            ? '목록 제공 우선순위를 정하는 데 소중히 활용할게요.'
            : '목록이 필요하다면 요청을 남겨주세요!'}
        </S.GachaInterestDescription>
      </S.GachaInterestCopy>
      <S.GachaInterestButton
        aria-label={`${storeName} 가챠 목록 ${isInterested ? '요청 완료' : '요청하기'}`}
        aria-pressed={isInterested}
        disabled={isInterested}
        type="button"
        onClick={requestInterest}
      >
        {isInterested ? '요청했어요' : '가챠 목록 요청하기'}
      </S.GachaInterestButton>
    </S.GachaInterestCard>
  );
}

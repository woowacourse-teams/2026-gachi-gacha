import { useEffect, useRef } from 'react';

/** 층이 열린 순서. 나중에 연 것이 큰 번호를 갖는다. */
let layerSequence = 0;

function getOpenLayerId() {
  const { state } = history;

  if (typeof state !== 'object' || state === null) return 0;

  const { closableLayer } = state as { closableLayer?: unknown };

  return typeof closableLayer === 'number' ? closableLayer : 0;
}

/**
 * 휴대폰 뒤로가기로 닫는다.
 *
 * 웹이라 안드로이드 뒤로가기와 iOS 가장자리 스와이프가 그대로 들어온다.
 * 아무것도 안 하면 사진을 보다가 뒤로가기를 눌렀을 때 앱을 나간다.
 *
 * 닫는 길은 하나뿐이어야 한다. 닫기 버튼도 상태를 직접 바꾸지 말고
 * `history.back()` 을 부르고, 실제로 닫는 건 여기서만 한다. 버튼이 상태만
 * 바꾸면 쌓아둔 항목이 남아서 다음 뒤로가기가 아무 일도 안 하고,
 * 사용자 눈에는 한 번 씹힌 것처럼 보인다.
 *
 * 여러 층이 겹칠 수 있다. 시트 위에 사진 뷰어가 뜨면 둘 다 `popstate` 를
 * 듣는데, 자기 번호가 히스토리에서 빠졌을 때만 닫는다. 그래서 뒤로가기
 * 한 번에 맨 위 하나만 닫히고 아래는 남는다.
 */
export function useBackClose(isOpen: boolean, onClose: () => void) {
  // 콜백이 매 렌더 새로 만들어져도 히스토리를 다시 쌓지 않게 최신 값만 들고 있는다.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    layerSequence += 1;

    const layerId = layerSequence;

    history.pushState({ closableLayer: layerId }, '');

    const handlePopState = () => {
      // 내 항목이 아직 히스토리에 있으면 내 차례가 아니다.
      if (getOpenLayerId() >= layerId) return;

      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    /*
     * 정리할 때 쌓아둔 항목을 되돌리지 않는다.
     *
     * StrictMode 는 개발 모드에서 effect 를 한 번 더 돌린다. 여기서
     * `history.back()` 을 부르면 그 뒤늦은 `popstate` 가 다시 마운트된 층을
     * 닫아버려서, 사진을 누르자마자 깜빡이고 꺼진다.
     *
     * 대신 닫는 길을 `history.back()` 하나로 모아서 항목이 남지 않게 한다.
     */
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen]);
}

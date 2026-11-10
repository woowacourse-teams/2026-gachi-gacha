/**
 * iOS(Safari, WKWebView)는 글자 크기가 16px보다 작은 입력칸에 포커스가 가면 화면을 확대한다.
 * 터치 기기에서만 입력 글자를 16px로 올려 확대를 막고, 데스크톱은 시안 크기를 유지한다.
 * 사용자의 손가락 확대를 막는 viewport 설정(maximum-scale 등)은 접근성 때문에 쓰지 않는다.
 *
 * 텍스트 입력칸(input, textarea, select)의 스타일 맨 끝에 넣어 앞선 font-size를 덮어쓴다.
 */
export const IOS_MIN_INPUT_FONT_SIZE = '16px';

export const preventIosInputZoom = `
  @media (pointer: coarse) {
    font-size: ${IOS_MIN_INPUT_FONT_SIZE};
  }
`;

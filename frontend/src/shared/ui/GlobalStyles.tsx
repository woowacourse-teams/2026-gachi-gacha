import { Global, css } from '@emotion/react';

const globalStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    min-height: 100%;
  }

  body {
    margin: 0;
    background: var(--color-surface, #ffffff);
    color: var(--color-text, #242122);
    font-family:
      Pretendard,
      'Noto Sans KR',
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }
`;

export function GlobalStyles() {
  return <Global styles={globalStyles} />;
}

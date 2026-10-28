import { css } from '@emotion/react';

export const globalStyle = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: 'IBM Plex Sans KR', sans-serif;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }
`;

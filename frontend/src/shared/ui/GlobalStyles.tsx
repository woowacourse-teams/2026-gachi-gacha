import { Global, css } from '@emotion/react';

import { colorVariables } from '@/shared/styles/tokens';

const globalStyles = css`
  :root {
    --color-text: ${colorVariables['--color-text']};
    --color-text-muted: ${colorVariables['--color-text-muted']};
    --color-text-subtle: ${colorVariables['--color-text-subtle']};
    --color-border: ${colorVariables['--color-border']};
    --color-border-subtle: ${colorVariables['--color-border-subtle']};
    --color-surface: ${colorVariables['--color-surface']};
    --color-surface-muted: ${colorVariables['--color-surface-muted']};
    --color-primary: ${colorVariables['--color-primary']};
    --color-primary-hover: ${colorVariables['--color-primary-hover']};
    --color-primary-soft: ${colorVariables['--color-primary-soft']};
  }

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
    background: var(--color-surface);
    color: var(--color-text);
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

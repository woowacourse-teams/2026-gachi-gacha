import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router';

import { AuthSessionProvider } from '@/features/auth/AuthSessionContext';
import { ToastProvider } from '@/shared/ui/toast';

interface RenderWithProvidersOptions {
  initialAccessToken?: string | null;
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { initialAccessToken, route = '/' }: RenderWithProvidersOptions = {},
) {
  window.history.replaceState(null, '', route);
  const authSessionProps =
    initialAccessToken === undefined ? {} : { initialAccessToken };

  return render(
    <BrowserRouter>
      <AuthSessionProvider {...authSessionProps}>
        <ToastProvider>{ui}</ToastProvider>
      </AuthSessionProvider>
    </BrowserRouter>,
  );
}

import { type ReactNode, useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router';

import { HeaderSearch } from './HeaderSearch';

/** 입력칸에 포커스를 넣어 포커스 상태(테두리 없음)를 바로 볼 수 있게 한다. */
function FocusOnMount({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.querySelector('input')?.focus();
  }, []);

  return <div ref={rootRef}>{children}</div>;
}

const meta = {
  title: 'Shared/UI/HeaderSearch',
  component: HeaderSearch,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onSearch: () => undefined,
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ maxWidth: 760, padding: 16 }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof HeaderSearch>;

export default meta;

type Story = StoryObj<typeof meta>;

const mobileViewport = {
  viewport: {
    defaultViewport: 'mobile1',
  },
};

export const Desktop: Story = {};

export const DesktopFocused: Story = {
  render: (args) => (
    <FocusOnMount>
      <HeaderSearch {...args} />
    </FocusOnMount>
  ),
};

export const Mobile: Story = {
  args: {
    backTo: '/trade',
  },
  parameters: mobileViewport,
};

export const MobileFocused: Story = {
  args: {
    backTo: '/trade',
  },
  parameters: mobileViewport,
  render: (args) => (
    <FocusOnMount>
      <HeaderSearch {...args} />
    </FocusOnMount>
  ),
};

export const MobileWithKeyword: Story = {
  args: {
    backTo: '/trade',
    keyword: '치이카와',
  },
  parameters: mobileViewport,
  render: (args) => (
    <FocusOnMount>
      <HeaderSearch {...args} />
    </FocusOnMount>
  ),
};

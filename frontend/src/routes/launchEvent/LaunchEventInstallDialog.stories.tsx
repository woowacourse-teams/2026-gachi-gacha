import { useState } from 'react';
import styled from '@emotion/styled';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import {
  color,
  focusRing,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/shared/styles/tokens';

import { LaunchEventInstallDialog } from './LaunchEventInstallDialog';

/** 계정·응모 API 없이 실제 컴포넌트의 배치와 닫기 동작만 확인한다. */
function InstallDialogPreview() {
  const [open, setOpen] = useState(true);

  return (
    <PreviewSurface>
      <PreviewContent>
        <p>가치가챠 앱 출시 이벤트</p>
        <h1>가챠 선물 이벤트</h1>
        <p>앱에서 응모하고, 가챠 선물의 주인공이 되어 보세요.</p>
        <OpenButton type="button" onClick={() => setOpen(true)}>
          앱에서 응모하기
        </OpenButton>
      </PreviewContent>
      {open && <LaunchEventInstallDialog onClose={() => setOpen(false)} />}
    </PreviewSurface>
  );
}

const meta = {
  title: 'Routes/LaunchEvent/InstallDialog',
  component: LaunchEventInstallDialog,
  parameters: {
    layout: 'fullscreen',
    authSession: 'none',
    docs: {
      description: {
        component:
          '모바일에서도 공식 배지를 같은 높이로 가로 배치합니다. 실제 응모·로그인은 실행하지 않습니다. 배지는 실제 스토어 링크이므로 클릭하면 새 창이 열립니다.',
      },
    },
  },
  render: () => <InstallDialogPreview />,
} satisfies Meta<typeof LaunchEventInstallDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {
  args: { onClose: () => undefined },
};

const PreviewSurface = styled.main`
  display: grid;
  min-height: 100dvh;
  padding: ${space.xl};
  background: ${color.surfaceMuted};
  place-items: center;
`;

const PreviewContent = styled.section`
  width: min(100%, 480px);
  color: ${color.text};

  h1 {
    font-size: ${fontSize.pageTitle};
  }

  p {
    color: ${color.textMuted};
    line-height: 1.6;
  }
`;

const OpenButton = styled.button`
  width: 100%;
  min-height: 48px;
  margin-top: ${space.xl};
  padding: ${space.sm} ${space.lg};
  border: 0;
  border-radius: ${radius.control};
  background: ${color.primary};
  color: ${color.surface};
  font-weight: ${fontWeight.bold};
  cursor: pointer;

  &:focus-visible {
    outline: none;
    box-shadow: ${focusRing};
  }
`;

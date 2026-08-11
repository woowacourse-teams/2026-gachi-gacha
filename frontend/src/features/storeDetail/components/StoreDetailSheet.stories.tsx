import type { Meta, StoryObj } from '@storybook/react-webpack5';

import StoreDetailSheet from './StoreDetailSheet';
import * as S from './StoreDetailSheet.styles';
import StoreDetailSheetContainer from './StoreDetailSheetContainer';
import { useStoreDetailSheet } from '../hooks/useStoreDetailSheet';
import { mockStoreDetail } from '../mocks/storeDetail.mock';
import { toStoreDetail } from '../model/toStoreDetail';

const store = toStoreDetail(mockStoreDetail, { distanceMeters: 380 });
const doNothing = () => undefined;

function PinClickDemo() {
  const { closeStoreDetail, openStoreDetail, selection, setState, state } =
    useStoreDetailSheet();

  return (
    <S.DemoMap>
      <S.DemoMapLabel>핀을 눌러 매장 상세를 열어보세요</S.DemoMapLabel>
      <S.DemoPinButton
        aria-label="가챠스테이션 홍대점 선택"
        type="button"
        onClick={() => openStoreDetail({ storeId: 1, distanceMeters: 380 })}
      >
        <span aria-hidden="true">★</span>
      </S.DemoPinButton>
      <StoreDetailSheetContainer
        distanceMeters={selection?.distanceMeters}
        state={state}
        storeId={selection?.storeId ?? null}
        onClose={closeStoreDetail}
        onStateChange={setState}
      />
    </S.DemoMap>
  );
}

const meta = {
  title: 'Store/Store detail sheet',
  decorators: [
    (Story) => (
      <S.StoryFrame>
        <Story />
      </S.StoryFrame>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {
  render: () => (
    <StoreDetailSheetContainer
      distanceMeters={380}
      state="full"
      storeId={1}
      onClose={doNothing}
      onStateChange={doNothing}
    />
  ),
};

export const SuccessWithoutImage: Story = {
  render: () => (
    <StoreDetailSheet
      state="full"
      status="success"
      store={store}
      onClose={doNothing}
      onStateChange={doNothing}
    />
  ),
};

export const Summary: Story = {
  render: () => (
    <StoreDetailSheet
      state="summary"
      status="success"
      store={store}
      onClose={doNothing}
      onStateChange={doNothing}
    />
  ),
};

export const Collapsed: Story = {
  render: () => (
    <StoreDetailSheet
      state="collapsed"
      status="success"
      store={store}
      onClose={doNothing}
      onStateChange={doNothing}
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <StoreDetailSheet
      state="full"
      status="loading"
      onClose={doNothing}
      onStateChange={doNothing}
    />
  ),
};

export const Error: Story = {
  render: () => (
    <StoreDetailSheet
      state="full"
      status="error"
      onClose={doNothing}
      onRetry={doNothing}
      onStateChange={doNothing}
    />
  ),
};

export const PinClickAndSwipe: Story = {
  render: () => <PinClickDemo />,
};

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import StoreDetailSheet from './StoreDetailSheet';
import * as S from './StoreDetailSheet.styles';
import StoreDetailSheetContainer from './StoreDetailSheetContainer';
import { useStoreDetailSheet } from '../hooks/useStoreDetailSheet';
import { mockStoreDetail } from '../mocks/storeDetail.mock';
import { mockStoreImages } from '../mocks/storePhotos.mock';
import { toStoreDetail } from '../model/toStoreDetail';

const store = toStoreDetail(mockStoreDetail, { distanceMeters: 380 });
const storeWithInstagramWithoutGachaImages = toStoreDetail(
  {
    ...mockStoreDetail,
    storeId: 55,
  },
  {
    distanceMeters: 380,
    gachaImageUrls: [],
    isGachaCatalogLoaded: true,
  },
);
const storeWithGallery = toStoreDetail(
  {
    ...mockStoreDetail,
    thumbnailUrl: mockStoreImages[0] ?? null,
    images: mockStoreImages.map((imageUrl, index) => ({
      storeImageId: index + 1,
      imageUrl,
    })),
  },
  {
    distanceMeters: 380,
    gachaImageUrls: Array.from(
      { length: 20 },
      (_, index) =>
        `${mockStoreImages[index % mockStoreImages.length] ?? ''}#g${index + 1}`,
    ),
    gachaTotalPages: 3,
    isGachaCatalogLoaded: true,
  },
);
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

export const GalleryWithGachaImages: Story = {
  render: () => (
    <StoreDetailSheet
      state="full"
      status="success"
      store={storeWithGallery}
      onClose={doNothing}
      onStateChange={doNothing}
    />
  ),
};

export const GachaInterestWithInstagram: Story = {
  render: () => (
    <StoreDetailSheet
      state="full"
      status="success"
      store={storeWithInstagramWithoutGachaImages}
      onClose={doNothing}
      onStateChange={doNothing}
    />
  ),
};

/** 2단계에서 대표 사진이 얼마나 차지하는지 본다. */
export const SummaryWithPhotos: Story = {
  render: () => (
    <StoreDetailSheet
      state="summary"
      status="success"
      store={storeWithGallery}
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

/** 사진을 눌러 전체화면으로 여는 흐름. 히어로와 가챠 사진 둘 다 열린다. */
export const PhotoViewerFlow: Story = {
  render: () => (
    <StoreDetailSheet
      state="full"
      status="success"
      store={storeWithGallery}
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

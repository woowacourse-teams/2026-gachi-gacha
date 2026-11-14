import { useCallback } from 'react';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import {
  PhotoViewer,
  type PhotoViewerNavigationSource,
} from '@/shared/ui/PhotoViewer';

export interface StorePhotoViewerProps {
  imageUrls: readonly string[];
  initialIndex: number;
  storeId: number;
  storeName: string;
  onClose: () => void;
  onImageError: (imageUrl: string) => void;
}

export function StorePhotoViewer({
  imageUrls,
  initialIndex,
  storeId,
  storeName,
  onClose,
  onImageError,
}: StorePhotoViewerProps) {
  const capturePhotoChange = useCallback(
    (photoIndex: number, source: PhotoViewerNavigationSource) => {
      if (source === 'initial') {
        return;
      }

      const analyticsSource = {
        previous_button: 'viewer_previous',
        next_button: 'viewer_next',
        thumbnail: 'viewer_thumbnail',
        scroll: 'viewer_scroll',
      }[source] as
        | 'viewer_previous'
        | 'viewer_next'
        | 'viewer_thumbnail'
        | 'viewer_scroll';

      captureAnalyticsEvent('store_photo_viewed', {
        store_id: storeId,
        photo_index: photoIndex,
        photo_count: imageUrls.length,
        source: analyticsSource,
      });
    },
    [imageUrls.length, storeId],
  );

  return (
    <PhotoViewer
      imageUrls={imageUrls}
      initialIndex={initialIndex}
      title={storeName}
      dialogLabel={`${storeName} 사진 전체 보기`}
      imageAltPrefix={`${storeName} 매장 사진`}
      thumbnailListLabel="매장 사진 목록"
      closeLabel="사진 전체 보기 닫기"
      onClose={onClose}
      onImageError={onImageError}
      onActiveIndexChange={capturePhotoChange}
    />
  );
}

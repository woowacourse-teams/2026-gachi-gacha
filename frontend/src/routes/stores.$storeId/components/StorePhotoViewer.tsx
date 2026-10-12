import { PhotoViewer } from '@/shared/ui/PhotoViewer';

export interface StorePhotoViewerProps {
  imageUrls: readonly string[];
  initialIndex: number;
  storeName: string;
  onClose: () => void;
  onImageError: (imageUrl: string) => void;
}

export function StorePhotoViewer({
  imageUrls,
  initialIndex,
  storeName,
  onClose,
  onImageError,
}: StorePhotoViewerProps) {
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
    />
  );
}

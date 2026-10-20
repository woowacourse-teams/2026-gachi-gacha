import { useState } from 'react';
import styled from '@emotion/styled';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { PhotoViewer } from '@/shared/ui/PhotoViewer';

import type { ChatMessageImage } from '../../model/chat';

interface ChatMessageGalleryProps {
  roomId: number;
  images: readonly ChatMessageImage[];
}

export default function ChatMessageGallery({
  roomId,
  images,
}: ChatMessageGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const imageUrls = images.map((image) => image.url);

  function openViewer(index: number) {
    captureAnalyticsEvent('chat_image_viewer_opened', {
      room_id: roomId,
      image_index: index,
      image_count: images.length,
    });
    setActiveImageIndex(index);
  }

  return (
    <>
      <Gallery $count={images.length}>
        {images.map((image, index) => (
          <ImageButton
            key={`${image.url}-${index}`}
            type="button"
            aria-label={`${index + 1}번째 사진 크게 보기`}
            onClick={() => openViewer(index)}
          >
            <Image
              src={image.url}
              alt={image.name || `채팅 사진 ${index + 1}`}
            />
          </ImageButton>
        ))}
      </Gallery>

      {activeImageIndex !== null && (
        <PhotoViewer
          imageUrls={imageUrls}
          initialIndex={activeImageIndex}
          title="채팅 사진"
          dialogLabel="채팅 사진 크게 보기"
          imageAltPrefix="채팅 사진"
          thumbnailListLabel="채팅 사진 목록"
          closeLabel="채팅 사진 닫기"
          onClose={() => setActiveImageIndex(null)}
        />
      )}
    </>
  );
}

const Gallery = styled.div<{ $count: number }>`
  display: grid;
  width: ${({ $count }) => ($count === 1 ? '220px' : '260px')};
  max-width: 100%;
  grid-template-columns: repeat(${({ $count }) => ($count === 1 ? 1 : 2)}, 1fr);
  gap: 3px;
`;

const ImageButton = styled.button`
  overflow: hidden;
  min-width: 0;
  padding: 0;
  aspect-ratio: 1;
  border: 0;
  border-radius: 10px;
  background: #eee9eb;
  cursor: zoom-in;
`;

const Image = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

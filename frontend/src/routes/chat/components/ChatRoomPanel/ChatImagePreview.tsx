import { useEffect, useMemo } from 'react';
import styled from '@emotion/styled';

interface ChatImagePreviewProps {
  files: readonly File[];
  onRemove: (index: number) => void;
}

export default function ChatImagePreview({
  files,
  onRemove,
}: ChatImagePreviewProps) {
  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(
    () => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)),
    [previewUrls],
  );

  return (
    <PreviewList aria-label="전송할 사진">
      {files.map((file, index) => (
        <PreviewItem key={`${file.name}-${file.lastModified}-${index}`}>
          <PreviewImage
            src={previewUrls[index]}
            alt={`${file.name} 미리보기`}
          />
          <RemoveButton
            type="button"
            aria-label={`${file.name} 사진 취소`}
            onClick={() => onRemove(index)}
          >
            ×
          </RemoveButton>
        </PreviewItem>
      ))}
    </PreviewList>
  );
}

const PreviewList = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 4px 2px 10px;
  gap: 8px;
`;

const PreviewItem = styled.div`
  position: relative;
  width: 76px;
  height: 76px;
  flex: 0 0 auto;
`;

const PreviewImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  border: 1px solid #e8e2e5;
  border-radius: 12px;
  object-fit: cover;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: -5px;
  right: -5px;
  display: grid;
  width: 24px;
  height: 24px;
  padding: 0;
  place-items: center;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: #3a3437;
  color: #ffffff;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
`;

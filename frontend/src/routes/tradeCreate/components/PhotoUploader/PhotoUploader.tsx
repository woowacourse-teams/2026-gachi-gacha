import { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';

const MAX_PHOTO_COUNT = 5;

interface PhotoUploaderProps {
  files: File[];
  initialImageUrls?: string[];
  onFilesChange: (files: File[]) => void;
  errorMessage?: string | undefined;
}

export default function PhotoUploader({
  files,
  initialImageUrls = [],
  onFilesChange,
  errorMessage,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  // 새 사진을 하나라도 고르면 기존 사진은 전부 교체되므로 화면에서도 숨긴다.
  const visibleInitialImageUrls = files.length > 0 ? [] : initialImageUrls;
  const photoCount = visibleInitialImageUrls.length + files.length;

  useEffect(() => {
    const nextPreviewUrls = files.map((file) => URL.createObjectURL(file));

    setPreviewUrls(nextPreviewUrls);

    return () => {
      nextPreviewUrls.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, [files]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    const availableCount = MAX_PHOTO_COUNT - files.length;
    const nextFiles = selectedFiles.slice(0, availableCount);

    onFilesChange([...files, ...nextFiles]);
    event.target.value = '';
  };

  const handleRemove = (targetIndex: number) => {
    onFilesChange(files.filter((_, index) => index !== targetIndex));
  };

  return (
    <Wrapper role="group" aria-labelledby="trade-photo-label" aria-required>
      <Label id="trade-photo-label">
        사진 <RequiredMark aria-hidden="true">*</RequiredMark>{' '}
        <Count>
          ({photoCount}/{MAX_PHOTO_COUNT})
        </Count>
      </Label>
      {initialImageUrls.length > 0 && (
        <Hint>새 사진을 추가하면 기존 사진은 모두 교체돼요.</Hint>
      )}

      <PhotoList>
        {files.length < MAX_PHOTO_COUNT && (
          <AddButton type="button" onClick={() => inputRef.current?.click()}>
            <CameraIcon aria-hidden="true" />
            <span>사진 추가</span>
          </AddButton>
        )}

        {visibleInitialImageUrls.map((url, index) => (
          <PreviewItem key={url}>
            <PreviewImage src={url} alt={`기존 교환 사진 ${index + 1}`} />
          </PreviewItem>
        ))}

        {previewUrls.map((url, index) => (
          <PreviewItem key={url}>
            <PreviewImage src={url} alt={`교환 사진 ${index + 1}`} />
            <RemoveButton
              type="button"
              aria-label={`교환 사진 ${index + 1} 삭제`}
              onClick={() => handleRemove(index)}
            >
              ×
            </RemoveButton>
          </PreviewItem>
        ))}
      </PhotoList>

      <HiddenInput
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
      />
      {errorMessage && <ErrorMessage role="alert">{errorMessage}</ErrorMessage>}
    </Wrapper>
  );
}

function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" {...props}>
      <path
        d="M8.5 6 10 4h4l1.5 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12.5"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Label = styled.p`
  margin: 0;
  color: #242429;
  font-size: 15px;
  font-weight: 800;
`;

const Hint = styled.p`
  margin: -4px 0 0;
  color: #858790;
  font-size: 13px;
`;

const Count = styled.span`
  color: #92949c;
  font-weight: 500;
`;

const RequiredMark = styled.span`
  color: #ed174c;
`;

const ErrorMessage = styled.p`
  margin: 0;
  color: #d80f42;
  font-size: 13px;
`;

const PhotoList = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
`;

const photoBoxStyle = css`
  box-sizing: border-box;
  width: 144px;
  aspect-ratio: 1 / 1;
  flex: 0 0 auto;
  border-radius: 14px;
`;

const AddButton = styled.button`
  ${photoBoxStyle};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #e2e2e5;
  background: #fafafa;
  color: #7f8189;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const PreviewItem = styled.div`
  ${photoBoxStyle};
  position: relative;
  overflow: hidden;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  display: grid;
  width: 26px;
  height: 26px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgb(24 24 27 / 72%);
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
`;

const HiddenInput = styled.input`
  display: none;
`;

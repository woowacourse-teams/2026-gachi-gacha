import { useState } from 'react';
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PhotoUploader from './PhotoUploader';

function ControlledPhotoUploader({
  initialImageUrls,
}: {
  initialImageUrls?: string[];
}) {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <PhotoUploader
      files={files}
      onFilesChange={setFiles}
      {...(initialImageUrls ? { initialImageUrls } : {})}
    />
  );
}

const INITIAL_IMAGE_URLS = [1, 2, 3, 4, 5].map(
  (index) => `https://cdn.example.com/trade-${index}.jpg`,
);

describe('PhotoUploader', () => {
  it('선택한 사진의 File 객체를 보관하고 삭제한다', async () => {
    const user = userEvent.setup();
    const { container } = render(<ControlledPhotoUploader />);
    const fileInput =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    const imageFile = new File(['image-content'], 'kuromi.png', {
      type: 'image/png',
    });

    expect(fileInput).not.toBeNull();

    await user.upload(fileInput as HTMLInputElement, imageFile);

    expect(fileInput?.files).toHaveLength(0);
    expect(
      await screen.findByRole('img', { name: '교환 사진 1' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '교환 사진 1 삭제' }));

    expect(
      screen.queryByRole('img', { name: '교환 사진 1' }),
    ).not.toBeInTheDocument();
  });

  it('새 사진을 선택하면 기존 사진을 모두 교체하고, 새 사진을 지우면 기존 사진을 다시 보여준다', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ControlledPhotoUploader initialImageUrls={INITIAL_IMAGE_URLS} />,
    );
    const fileInput =
      container.querySelector<HTMLInputElement>('input[type="file"]');

    expect(
      screen.getAllByRole('img', { name: /^기존 교환 사진/ }),
    ).toHaveLength(5);
    expect(screen.getByText('(5/5)')).toBeInTheDocument();
    // 기존 사진이 가득 차 있어도 교체할 수 있도록 추가 버튼을 보여준다.
    expect(
      screen.getByRole('button', { name: '사진 추가' }),
    ).toBeInTheDocument();

    await user.upload(
      fileInput as HTMLInputElement,
      new File(['image-content'], 'kuromi.png', { type: 'image/png' }),
    );

    expect(
      await screen.findByRole('img', { name: '교환 사진 1' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: /^기존 교환 사진/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('(1/5)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '교환 사진 1 삭제' }));

    expect(
      screen.getAllByRole('img', { name: /^기존 교환 사진/ }),
    ).toHaveLength(5);
  });

  it('새 사진은 기존 사진 수와 관계없이 최대 5장까지 선택된다', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ControlledPhotoUploader initialImageUrls={INITIAL_IMAGE_URLS} />,
    );
    const fileInput =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    const newImages = [1, 2, 3, 4, 5, 6].map(
      (index) =>
        new File([`image-${index}`], `new-${index}.png`, { type: 'image/png' }),
    );

    await user.upload(fileInput as HTMLInputElement, newImages);

    expect(
      await screen.findAllByRole('img', { name: /^교환 사진/ }),
    ).toHaveLength(5);
    expect(
      screen.queryByRole('button', { name: '사진 추가' }),
    ).not.toBeInTheDocument();
  });
});

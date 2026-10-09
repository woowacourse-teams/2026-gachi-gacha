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
      await screen.findByRole('img', { name: '거래 사진 1' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '거래 사진 1 삭제' }));

    expect(
      screen.queryByRole('img', { name: '거래 사진 1' }),
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
      screen.getAllByRole('img', { name: /^기존 거래 사진/ }),
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
      await screen.findByRole('img', { name: '거래 사진 1' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: /^기존 거래 사진/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('(1/5)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '거래 사진 1 삭제' }));

    expect(
      screen.getAllByRole('img', { name: /^기존 거래 사진/ }),
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
      await screen.findAllByRole('img', { name: /^거래 사진/ }),
    ).toHaveLength(5);
    expect(
      screen.queryByRole('button', { name: '사진 추가' }),
    ).not.toBeInTheDocument();
  });
  it('지원하지 않는 형식은 추가하지 않고 "지원하지 않는 형식입니다."를 안내한다', async () => {
    // accept 필터를 우회해 선택된 경우까지 검증하기 위해 accept 적용을 끈다.
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(<ControlledPhotoUploader />);
    const fileInput = container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    ) as HTMLInputElement;

    expect(fileInput).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
    );

    await user.upload(fileInput, [
      new File(['gif'], 'moving.gif', { type: 'image/gif' }),
      new File(['heic'], 'iphone.heic', { type: 'image/heic' }),
      new File(['video'], 'clip.mp4', { type: 'video/mp4' }),
    ]);

    expect(screen.getByRole('alert')).toHaveTextContent(
      '지원하지 않는 형식입니다.',
    );
    expect(
      screen.queryByRole('img', { name: /^거래 사진/ }),
    ).not.toBeInTheDocument();

    await user.upload(
      fileInput,
      new File(['image'], 'kuromi.png', { type: 'image/png' }),
    );

    expect(
      await screen.findByRole('img', { name: '거래 사진 1' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('허용 형식과 지원하지 않는 형식을 함께 고르면 허용 형식만 추가한다', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(<ControlledPhotoUploader />);
    const fileInput = container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(fileInput, [
      new File(['image'], 'kuromi.png', { type: 'image/png' }),
      new File(['gif'], 'moving.gif', { type: 'image/gif' }),
    ]);

    expect(
      await screen.findAllByRole('img', { name: /^거래 사진/ }),
    ).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent(
      '지원하지 않는 형식입니다.',
    );
  });

  it('용량을 넘는 사진은 추가하지 않고 용량 제한을 안내한다', async () => {
    const user = userEvent.setup();
    const { container } = render(<ControlledPhotoUploader />);
    const fileInput = container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    ) as HTMLInputElement;
    const largeImage = new File(['image'], 'large.jpg', { type: 'image/jpeg' });

    Object.defineProperty(largeImage, 'size', { value: 10 * 1024 * 1024 + 1 });

    await user.upload(fileInput, largeImage);

    expect(screen.getByRole('alert')).toHaveTextContent(
      '사진은 한 장당 10MB 이하만 올릴 수 있어요.',
    );
    expect(
      screen.queryByRole('img', { name: /^거래 사진/ }),
    ).not.toBeInTheDocument();
  });
});

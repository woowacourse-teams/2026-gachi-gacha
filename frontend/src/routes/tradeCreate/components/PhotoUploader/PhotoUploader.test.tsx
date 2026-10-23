import { useState } from 'react';
import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PhotoUploader from './PhotoUploader';

function ControlledPhotoUploader({
  initialImageUrls,
}: {
  initialImageUrls?: string[];
}) {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <>
      <PhotoUploader
        files={files}
        onFilesChange={setFiles}
        {...(initialImageUrls ? { initialImageUrls } : {})}
      />
      <output data-testid="selected-photo-order">
        {files.map((file) => file.name).join(',')}
      </output>
    </>
  );
}

const INITIAL_IMAGE_URLS = [1, 2, 3, 4, 5].map(
  (index) => `https://cdn.example.com/trade-${index}.jpg`,
);

function createExternalDataTransfer(files: File[]): DataTransfer {
  return {
    types: ['Files'],
    items: files.map((file) => ({ kind: 'file', type: file.type })),
    files,
    dropEffect: 'none',
  } as unknown as DataTransfer;
}

function createInternalDataTransfer(): DataTransfer {
  const data = new Map<string, string>();
  const types: string[] = [];

  return {
    types,
    items: [],
    files: [],
    dropEffect: 'none',
    effectAllowed: 'none',
    setData(type: string, value: string) {
      data.set(type, value);

      if (!types.includes(type)) {
        types.push(type);
      }
    },
    getData(type: string) {
      return data.get(type) ?? '';
    },
  } as unknown as DataTransfer;
}

function createPointerEvent(
  type: string,
  properties: Record<string, unknown>,
): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.entries(properties).forEach(([property, value]) => {
    Object.defineProperty(event, property, { value });
  });

  return event;
}

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

  it('클립보드의 사진을 붙여넣어 추가한다', async () => {
    render(<ControlledPhotoUploader />);
    const pastedImage = new File(['pasted-image'], '', { type: 'image/png' });

    fireEvent.paste(window, {
      clipboardData: { files: [pastedImage] },
    });

    expect(
      await screen.findByRole('img', { name: '거래 사진 1' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('selected-photo-order')).toHaveTextContent(
      /^pasted-image-\d+-1\.png$/,
    );
  });

  it('클립보드가 files 대신 items로 사진을 제공해도 붙여넣는다', async () => {
    render(<ControlledPhotoUploader />);
    const pastedImage = new File(['pasted-image'], 'clipboard.webp', {
      type: 'image/webp',
    });

    fireEvent.paste(window, {
      clipboardData: {
        files: [],
        items: [
          {
            kind: 'file',
            type: 'image/webp',
            getAsFile: () => pastedImage,
          },
        ],
      },
    });

    expect(
      await screen.findByRole('img', { name: '거래 사진 1' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('selected-photo-order')).toHaveTextContent(
      'clipboard.webp',
    );
  });

  it('외부 사진을 끌어온 동안에만 드롭 안내를 표시하고 놓은 사진을 추가한다', async () => {
    render(<ControlledPhotoUploader />);
    const dropZone = screen.getByTestId('trade-photo-drop-zone');
    const droppedImage = new File(['dropped-image'], 'dropped.png', {
      type: 'image/png',
    });
    const dataTransfer = createExternalDataTransfer([droppedImage]);

    fireEvent.dragEnter(dropZone, { dataTransfer });

    expect(screen.getByText('사진을 여기에 놓아주세요')).toBeInTheDocument();

    fireEvent.drop(dropZone, { dataTransfer });

    expect(
      screen.queryByText('사진을 여기에 놓아주세요'),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole('img', { name: '거래 사진 1' }),
    ).toBeInTheDocument();
  });

  it('내부 사진 드래그는 외부 드롭 안내 없이 순서를 변경한다', async () => {
    const user = userEvent.setup();
    const { container } = render(<ControlledPhotoUploader />);
    const fileInput = container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(fileInput, [
      new File(['first'], 'first.png', { type: 'image/png' }),
      new File(['second'], 'second.png', { type: 'image/png' }),
    ]);

    const [firstPhoto, secondPhoto] = screen.getAllByRole('listitem', {
      name: /^거래 사진/,
    });
    const dataTransfer = createInternalDataTransfer();

    fireEvent.dragStart(firstPhoto as HTMLElement, { dataTransfer });

    expect(
      screen.queryByText('사진을 여기에 놓아주세요'),
    ).not.toBeInTheDocument();

    fireEvent.dragOver(secondPhoto as HTMLElement, { dataTransfer });
    fireEvent.drop(secondPhoto as HTMLElement, { dataTransfer });

    expect(screen.getByTestId('selected-photo-order')).toHaveTextContent(
      'second.png,first.png',
    );
  });

  it('사진에 초점을 두고 방향키로 순서를 변경한다', async () => {
    const user = userEvent.setup();
    const { container } = render(<ControlledPhotoUploader />);
    const fileInput = container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(fileInput, [
      new File(['first'], 'first.png', { type: 'image/png' }),
      new File(['second'], 'second.png', { type: 'image/png' }),
    ]);

    const [firstPhoto] = screen.getAllByRole('listitem', {
      name: /^거래 사진/,
    });
    fireEvent.keyDown(firstPhoto as HTMLElement, { key: 'ArrowRight' });

    expect(screen.getByTestId('selected-photo-order')).toHaveTextContent(
      'second.png,first.png',
    );
  });

  it('터치 포인터로 사진을 끌어 순서를 변경한다', async () => {
    const user = userEvent.setup();
    const { container } = render(<ControlledPhotoUploader />);
    const fileInput = container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(fileInput, [
      new File(['first'], 'first.png', { type: 'image/png' }),
      new File(['second'], 'second.png', { type: 'image/png' }),
    ]);

    const [firstPhoto, secondPhoto] = screen.getAllByRole('listitem', {
      name: /^거래 사진/,
    });
    const originalElementFromPoint = document.elementFromPoint;
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: jest.fn(() => secondPhoto as HTMLElement),
    });
    Object.defineProperty(firstPhoto, 'setPointerCapture', {
      configurable: true,
      value: jest.fn(),
    });

    fireEvent(
      firstPhoto as HTMLElement,
      createPointerEvent('pointerdown', {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        clientX: 10,
        clientY: 10,
      }),
    );
    fireEvent(
      firstPhoto as HTMLElement,
      createPointerEvent('pointermove', {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        clientX: 40,
        clientY: 10,
      }),
    );
    fireEvent(
      firstPhoto as HTMLElement,
      createPointerEvent('pointerup', {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        clientX: 40,
        clientY: 10,
      }),
    );

    expect(screen.getByTestId('selected-photo-order')).toHaveTextContent(
      'second.png,first.png',
    );
    if (originalElementFromPoint) {
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: originalElementFromPoint,
      });
    } else {
      Reflect.deleteProperty(document, 'elementFromPoint');
    }
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

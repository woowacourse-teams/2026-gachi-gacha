import { useState } from 'react';
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PhotoUploader from './PhotoUploader';

function ControlledPhotoUploader() {
  const [files, setFiles] = useState<File[]>([]);

  return <PhotoUploader files={files} onFilesChange={setFiles} />;
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
      await screen.findByRole('img', { name: '교환 사진 1' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '교환 사진 1 삭제' }));

    expect(
      screen.queryByRole('img', { name: '교환 사진 1' }),
    ).not.toBeInTheDocument();
  });
});

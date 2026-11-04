import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { UpdateCurrentMemberInput } from '@/features/auth/api/updateCurrentMember';
import { uploadProfileImage } from '@/features/auth/api/uploadProfileImage';
import type { AuthMember } from '@/features/auth/authMemberType';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';

import { ProfileEditDialog } from './ProfileEditDialog';

jest.mock('@/features/placeSearch/KakaoPlaceSearchDialog', () => ({
  KakaoPlaceSearchDialog: ({
    open,
    title,
    onClose,
    onSelect,
  }: {
    open: boolean;
    title: string;
    onClose: () => void;
    onSelect: (place: {
      name: string;
      address: string;
      latitude: number;
      longitude: number;
    }) => void;
  }) =>
    open ? (
      <button
        type="button"
        onClick={() => {
          onSelect({
            name: '합정역 2번 출구',
            address: '서울특별시 마포구 양화로 45',
            latitude: 37.5495,
            longitude: 126.9137,
          });
          onClose();
        }}
      >
        {title} 테스트 장소 선택
      </button>
    ) : null,
}));

jest.mock('@/features/auth/api/uploadProfileImage', () => ({
  uploadProfileImage: jest.fn(),
}));

jest.mock('@/shared/analytics/analyticsClient', () => ({
  captureAnalyticsEvent: jest.fn(),
}));

const mockedUploadProfileImage = jest.mocked(uploadProfileImage);
const mockedCaptureAnalyticsEvent = jest.mocked(captureAnalyticsEvent);

const MEMBER = {
  name: '김민지',
  nickname: '가챠러 민지',
  profileImageUrl: null,
  desireTradeLocation: '홍대입구역',
} satisfies AuthMember;

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };

  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
});

beforeEach(() => {
  mockedUploadProfileImage.mockReset();
  mockedCaptureAnalyticsEvent.mockReset();
});

describe('ProfileEditDialog', () => {
  it('선택한 사진을 미리 보여주고 업로드한 URL로 프로필을 저장한다', async () => {
    const user = userEvent.setup();
    const onSave = jest
      .fn<(input: UpdateCurrentMemberInput) => Promise<void>>()
      .mockResolvedValue(undefined);
    const imageFile = new File(['profile-image'], 'new-profile.png', {
      type: 'image/png',
    });
    mockedUploadProfileImage.mockResolvedValue(
      'https://cdn.example.com/new-profile.png',
    );

    render(
      <ProfileEditDialog
        open
        member={MEMBER}
        onClose={jest.fn()}
        onSave={onSave}
      />,
    );

    await user.upload(screen.getByLabelText('프로필 사진 선택'), imageFile);

    expect(
      screen.getByRole('img', { name: '새 프로필 사진 미리보기' }),
    ).toHaveAttribute('src', 'blob:test-preview');
    expect(screen.getByText('new-profile.png')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '저장하기' }));

    await waitFor(() => {
      expect(mockedUploadProfileImage).toHaveBeenCalledWith(imageFile);
      expect(onSave).toHaveBeenCalledWith({
        nickname: '가챠러 민지',
        profileImageUrl: 'https://cdn.example.com/new-profile.png',
        desireTradeLocation: '홍대입구역',
      });
    });
    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'profile_image_selection_completed',
      {
        outcome: 'success',
        rejection_reason: 'none',
        format: 'png',
        size_bucket: 'under_1mb',
      },
    );
    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'profile_image_upload_started',
      {
        format: 'png',
        size_bucket: 'under_1mb',
      },
    );
    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'profile_image_upload_completed',
      {
        outcome: 'success',
        format: 'png',
        size_bucket: 'under_1mb',
      },
    );
    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'profile_update_completed',
      expect.objectContaining({
        outcome: 'success',
        image_change: 'replaced',
      }),
    );
  });

  it('지원하지 않는 프로필 사진은 업로드하지 않고 형식을 안내한다', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onSave = jest
      .fn<(input: UpdateCurrentMemberInput) => Promise<void>>()
      .mockResolvedValue(undefined);
    const imageFile = new File(['animated-image'], 'profile.gif', {
      type: 'image/gif',
    });

    render(
      <ProfileEditDialog
        open
        member={MEMBER}
        onClose={jest.fn()}
        onSave={onSave}
      />,
    );

    await user.upload(screen.getByLabelText('프로필 사진 선택'), imageFile);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'JPG, PNG, WebP 형식의 사진만 올릴 수 있어요.',
    );
    expect(mockedUploadProfileImage).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'profile_image_selection_completed',
      {
        outcome: 'failure',
        rejection_reason: 'unsupported_type',
        format: 'other',
        size_bucket: 'under_1mb',
      },
    );
  });

  it('사진 업로드에 실패하면 회원 정보를 수정하지 않고 오류를 안내한다', async () => {
    const user = userEvent.setup();
    const onSave = jest
      .fn<(input: UpdateCurrentMemberInput) => Promise<void>>()
      .mockResolvedValue(undefined);
    const imageFile = new File(['profile-image'], 'new-profile.webp', {
      type: 'image/webp',
    });
    mockedUploadProfileImage.mockRejectedValue(
      new Error('프로필 사진을 업로드하지 못했습니다.'),
    );

    render(
      <ProfileEditDialog
        open
        member={MEMBER}
        onClose={jest.fn()}
        onSave={onSave}
      />,
    );

    await user.upload(screen.getByLabelText('프로필 사진 선택'), imageFile);
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    expect(
      await screen.findByText('프로필 사진을 업로드하지 못했습니다.'),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
    expect(mockedCaptureAnalyticsEvent).toHaveBeenCalledWith(
      'profile_image_upload_completed',
      {
        outcome: 'failure',
        format: 'webp',
        size_bucket: 'under_1mb',
      },
    );
  });

  it('카카오 장소 검색에서 선택한 장소명을 선호 거래 지역으로 저장한다', async () => {
    const user = userEvent.setup();
    const onSave = jest
      .fn<(input: UpdateCurrentMemberInput) => Promise<void>>()
      .mockResolvedValue(undefined);

    render(
      <ProfileEditDialog
        open
        member={MEMBER}
        onClose={jest.fn()}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole('button', { name: /홍대입구역.*검색/ }));
    await user.click(
      screen.getByRole('button', {
        name: '선호 거래 지역 선택 테스트 장소 선택',
      }),
    );

    expect(screen.getByText('합정역 2번 출구')).toBeInTheDocument();
    expect(screen.getByText('서울특별시 마포구 양화로 45')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '저장하기' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        nickname: '가챠러 민지',
        profileImageUrl: null,
        desireTradeLocation: '합정역 2번 출구',
      });
    });
  });

  it('선호 거래 지역 선택을 해제하면 null로 저장한다', async () => {
    const user = userEvent.setup();
    const onSave = jest
      .fn<(input: UpdateCurrentMemberInput) => Promise<void>>()
      .mockResolvedValue(undefined);

    render(
      <ProfileEditDialog
        open
        member={MEMBER}
        onClose={jest.fn()}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole('button', { name: '선택 해제' }));
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        nickname: '가챠러 민지',
        profileImageUrl: null,
        desireTradeLocation: null,
      });
    });
  });
});

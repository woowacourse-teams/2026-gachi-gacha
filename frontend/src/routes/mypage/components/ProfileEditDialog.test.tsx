import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { UpdateCurrentMemberInput } from '@/features/auth/api/updateCurrentMember';
import type { AuthMember } from '@/features/auth/authMemberType';

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

describe('ProfileEditDialog', () => {
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

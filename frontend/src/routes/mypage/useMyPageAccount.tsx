import { useState } from 'react';

import { useAuthSession } from '@/features/auth/AuthSessionContext';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import {
  assignBrowserLocation,
  replaceBrowserLocation,
} from '@/shared/browser/browserNavigation';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

import { AccountDeletionDialog } from './components/AccountDeletionDialog';
import { ProfileEditDialog } from './components/ProfileEditDialog';

/** 마이 메뉴의 프로필 수정·로그아웃·회원 탈퇴 동작과 확인 창을 묶는다. */
export function useMyPageAccount() {
  const { member, deleteAccount, logout, updateProfile } = useAuthSession();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isDeletionDialogOpen, setIsDeletionDialogOpen] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  function openProfileEdit() {
    captureAnalyticsEvent('profile_edit_started', {});
    setIsProfileDialogOpen(true);
  }

  function requestLogout() {
    captureAnalyticsEvent('account_menu_selected', {
      target: 'logout',
      source: 'mypage',
    });
    setIsLogoutDialogOpen(true);
  }

  function confirmLogout() {
    setIsLogoutDialogOpen(false);
    logout();
    replaceBrowserLocation('/trade');
  }

  function requestAccountDeletion() {
    captureAnalyticsEvent('account_menu_selected', {
      target: 'delete_account',
      source: 'mypage',
    });
    setIsDeletionDialogOpen(true);
  }

  async function handleDeleteAccount() {
    try {
      const result = await deleteAccount();

      if (result.status === 'reauthentication-required') {
        assignBrowserLocation(result.authorizationUrl);
        return;
      }

      captureAnalyticsEvent('account_deletion_completed', {
        outcome: 'success',
      });
      replaceBrowserLocation('/trade');
    } catch (error) {
      captureAnalyticsEvent('account_deletion_completed', {
        outcome: 'failure',
      });
      throw error;
    }
  }

  const dialogs = member ? (
    <>
      <ProfileEditDialog
        open={isProfileDialogOpen}
        member={member}
        onClose={() => setIsProfileDialogOpen(false)}
        onSave={updateProfile}
        onSaved={() => setProfileNotice('프로필 정보를 저장했어요.')}
      />
      <ConfirmDialog
        open={isLogoutDialogOpen}
        title="로그아웃할까요?"
        description="이 기기에서 로그인 정보가 삭제돼요."
        confirmLabel="로그아웃"
        onCancel={() => setIsLogoutDialogOpen(false)}
        onConfirm={confirmLogout}
      />
      <AccountDeletionDialog
        open={isDeletionDialogOpen}
        onClose={() => setIsDeletionDialogOpen(false)}
        onDelete={handleDeleteAccount}
      />
    </>
  ) : null;

  return {
    member,
    profileNotice,
    openProfileEdit,
    requestLogout,
    requestAccountDeletion,
    dialogs,
  };
}

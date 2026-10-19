import { type FormEvent, useEffect, useRef, useState } from 'react';

import type { UpdateCurrentMemberInput } from '@/features/auth/api/updateCurrentMember';
import { uploadProfileImage } from '@/features/auth/api/uploadProfileImage';
import type { AuthMember } from '@/features/auth/authMemberType';
import {
  PROFILE_IMAGE_ACCEPT,
  PROFILE_IMAGE_TOO_LARGE_MESSAGE,
  PROFILE_IMAGE_UNSUPPORTED_TYPE_MESSAGE,
  validateProfileImage,
} from '@/features/auth/profileImagePolicy';
import { KakaoPlaceSearchDialog } from '@/features/placeSearch/KakaoPlaceSearchDialog';
import type { PlaceSearchSelection } from '@/features/placeSearch/placeSearchType';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import type {
  AnalyticsImageFormat,
  AnalyticsImageSizeBucket,
  ProfileTradeLocationChange,
} from '@/shared/analytics/analyticsEventType';

import {
  Actions,
  ClearPlaceButton,
  CloseButton,
  Description,
  Dialog,
  ErrorMessage,
  Field,
  FieldHint,
  FieldLabel,
  Form,
  Header,
  HiddenFileInput,
  Input,
  InteractiveField,
  Panel,
  PlaceSearchAction,
  PlaceSelectButton,
  PlaceSelection,
  PlaceSelectionAddress,
  PlaceSelectionName,
  PrimaryButton,
  ProfilePhotoActions,
  ProfilePhotoEditor,
  ProfilePhotoFallback,
  ProfilePhotoFileName,
  ProfilePhotoPreview,
  ProfilePhotoSelectButton,
  SecondaryButton,
  Title,
} from './AccountDialog.styles';

const MAX_FIELD_LENGTH = 255;

function getImageFormat(file: File): AnalyticsImageFormat {
  const normalizedType = file.type.toLowerCase();
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (
    normalizedType === 'image/jpeg' ||
    ['jpg', 'jpeg'].includes(extension ?? '')
  ) {
    return 'jpeg';
  }

  if (normalizedType === 'image/png' || extension === 'png') {
    return 'png';
  }

  if (normalizedType === 'image/webp' || extension === 'webp') {
    return 'webp';
  }

  return 'other';
}

function getImageSizeBucket(fileSize: number): AnalyticsImageSizeBucket {
  const megabyte = 1024 * 1024;

  if (fileSize < megabyte) {
    return 'under_1mb';
  }

  if (fileSize < 5 * megabyte) {
    return '1_to_5mb';
  }

  if (fileSize <= 10 * megabyte) {
    return '5_to_10mb';
  }

  return 'over_10mb';
}

function getTradeLocationChange(
  previousLocation: string | null,
  nextLocation: string | null,
): ProfileTradeLocationChange {
  const normalizedPreviousLocation = previousLocation?.trim() || null;
  const normalizedNextLocation = nextLocation?.trim() || null;

  if (normalizedPreviousLocation === normalizedNextLocation) {
    return 'unchanged';
  }

  if (!normalizedPreviousLocation && normalizedNextLocation) {
    return 'set';
  }

  if (normalizedPreviousLocation && !normalizedNextLocation) {
    return 'cleared';
  }

  return 'changed';
}

export interface ProfileEditDialogProps {
  open: boolean;
  member: AuthMember;
  onClose: () => void;
  onSave: (input: UpdateCurrentMemberInput) => Promise<void>;
  onSaved?: () => void;
}

export function ProfileEditDialog({
  open,
  member,
  onClose,
  onSave,
  onSaved,
}: ProfileEditDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nickname, setNickname] = useState('');
  const [desireTradeLocation, setDesireTradeLocation] = useState('');
  const [selectedPlaceAddress, setSelectedPlaceAddress] = useState<
    string | null
  >(null);
  const [isPlaceSearchOpen, setIsPlaceSearchOpen] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<
    string | null
  >(null);
  const [profileImageErrorMessage, setProfileImageErrorMessage] = useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      setNickname(member.nickname ?? '');
      setDesireTradeLocation(member.desireTradeLocation ?? '');
      setSelectedPlaceAddress(null);
      setIsPlaceSearchOpen(false);
      setProfileImageFile(null);
      setProfileImageErrorMessage(null);
      setErrorMessage(null);
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [member.desireTradeLocation, member.nickname, open]);

  useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(profileImageFile);
    setProfileImagePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [profileImageFile]);

  function closeDialog() {
    if (!isSubmitting) {
      dialogRef.current?.close();
    }
  }

  function selectTradeLocation(place: PlaceSearchSelection) {
    setDesireTradeLocation(place.name);
    setSelectedPlaceAddress(place.address);
  }

  function clearTradeLocation() {
    captureAnalyticsEvent('place_selection_cleared', {
      place_context: 'profile_preferred_area',
      trade_form_mode: null,
    });
    setDesireTradeLocation('');
    setSelectedPlaceAddress(null);
  }

  function selectProfileImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    const rejection = validateProfileImage(file);
    const imageProperties = {
      format: getImageFormat(file),
      size_bucket: getImageSizeBucket(file.size),
    };

    if (rejection) {
      captureAnalyticsEvent('profile_image_selection_completed', {
        outcome: 'failure',
        rejection_reason:
          rejection === 'too-large' ? 'too_large' : 'unsupported_type',
        ...imageProperties,
      });
      setProfileImageFile(null);
      setProfileImageErrorMessage(
        rejection === 'too-large'
          ? PROFILE_IMAGE_TOO_LARGE_MESSAGE
          : PROFILE_IMAGE_UNSUPPORTED_TYPE_MESSAGE,
      );
      return;
    }

    captureAnalyticsEvent('profile_image_selection_completed', {
      outcome: 'success',
      rejection_reason: 'none',
      ...imageProperties,
    });
    setProfileImageFile(file);
    setProfileImageErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedNickname = nickname.trim();
    const normalizedLocation = desireTradeLocation.trim();
    const tradeLocationChange = getTradeLocationChange(
      member.desireTradeLocation,
      normalizedLocation || null,
    );

    if (!normalizedNickname) {
      setErrorMessage('닉네임을 입력해 주세요.');
      return;
    }

    if (profileImageErrorMessage) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let profileImageUrl = member.profileImageUrl;

      if (profileImageFile) {
        const imageProperties = {
          format: getImageFormat(profileImageFile),
          size_bucket: getImageSizeBucket(profileImageFile.size),
        };

        captureAnalyticsEvent('profile_image_upload_started', imageProperties);

        try {
          profileImageUrl = await uploadProfileImage(profileImageFile);
          captureAnalyticsEvent('profile_image_upload_completed', {
            outcome: 'success',
            ...imageProperties,
          });
        } catch (error) {
          captureAnalyticsEvent('profile_image_upload_completed', {
            outcome: 'failure',
            ...imageProperties,
          });
          throw error;
        }
      }

      await onSave({
        nickname: normalizedNickname,
        profileImageUrl,
        desireTradeLocation: normalizedLocation || null,
      });
      captureAnalyticsEvent('profile_update_completed', {
        outcome: 'success',
        has_trade_location: Boolean(normalizedLocation),
        trade_location_change: tradeLocationChange,
        image_change: profileImageFile ? 'replaced' : 'unchanged',
      });
      onSaved?.();
      dialogRef.current?.close();
    } catch (error) {
      captureAnalyticsEvent('profile_update_completed', {
        outcome: 'failure',
        has_trade_location: Boolean(normalizedLocation),
        trade_location_change: tradeLocationChange,
        image_change: profileImageFile ? 'replaced' : 'unchanged',
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '프로필을 저장하지 못했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      ref={dialogRef}
      aria-labelledby="profile-edit-title"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeDialog();
        }
      }}
      data-private
    >
      <Panel>
        <Header>
          <div>
            <Title id="profile-edit-title">프로필 수정</Title>
            <Description>
              마이페이지와 교환 활동에 표시할 정보를 관리해요.
            </Description>
          </div>
          <CloseButton
            type="button"
            aria-label="프로필 수정 창 닫기"
            onClick={closeDialog}
          >
            ×
          </CloseButton>
        </Header>

        <Form onSubmit={handleSubmit}>
          <InteractiveField>
            <FieldLabel>프로필 사진</FieldLabel>
            <ProfilePhotoEditor>
              {profileImagePreviewUrl || member.profileImageUrl ? (
                <ProfilePhotoPreview
                  src={profileImagePreviewUrl ?? member.profileImageUrl ?? ''}
                  alt={
                    profileImagePreviewUrl
                      ? '새 프로필 사진 미리보기'
                      : '현재 프로필 사진'
                  }
                  data-private-media
                />
              ) : (
                <ProfilePhotoFallback aria-hidden="true">
                  {member.nickname?.trim().slice(0, 1) || 'G'}
                </ProfilePhotoFallback>
              )}
              <ProfilePhotoActions>
                <ProfilePhotoSelectButton>
                  사진 변경
                  <HiddenFileInput
                    type="file"
                    accept={PROFILE_IMAGE_ACCEPT}
                    aria-label="프로필 사진 선택"
                    disabled={isSubmitting}
                    onChange={selectProfileImage}
                  />
                </ProfilePhotoSelectButton>
                {profileImageFile && (
                  <ProfilePhotoFileName title={profileImageFile.name}>
                    {profileImageFile.name}
                  </ProfilePhotoFileName>
                )}
                <FieldHint>JPG, PNG, WebP · 최대 10MB</FieldHint>
              </ProfilePhotoActions>
            </ProfilePhotoEditor>
            {profileImageErrorMessage && (
              <ErrorMessage role="alert">
                {profileImageErrorMessage}
              </ErrorMessage>
            )}
          </InteractiveField>

          <Field>
            <FieldLabel>닉네임</FieldLabel>
            <Input
              value={nickname}
              maxLength={MAX_FIELD_LENGTH}
              placeholder="사용할 닉네임을 입력해 주세요"
              onChange={(event) => setNickname(event.target.value)}
              autoFocus
              required
            />
          </Field>

          <InteractiveField>
            <FieldLabel>선호 거래 지역</FieldLabel>
            <PlaceSelectButton
              type="button"
              aria-haspopup="dialog"
              onClick={() => setIsPlaceSearchOpen(true)}
            >
              <PlaceSelection>
                <PlaceSelectionName $empty={!desireTradeLocation}>
                  {desireTradeLocation || '카카오 장소 검색으로 선택해 주세요'}
                </PlaceSelectionName>
                {selectedPlaceAddress && (
                  <PlaceSelectionAddress>
                    {selectedPlaceAddress}
                  </PlaceSelectionAddress>
                )}
              </PlaceSelection>
              <PlaceSearchAction>검색</PlaceSearchAction>
            </PlaceSelectButton>
            {desireTradeLocation && (
              <ClearPlaceButton type="button" onClick={clearTradeLocation}>
                선택 해제
              </ClearPlaceButton>
            )}
            <FieldHint>
              아직 정하지 않았다면 비워둘 수 있어요. 정확한 약속 장소는 채팅에서
              다시 확인해 주세요.
            </FieldHint>
          </InteractiveField>

          {errorMessage && (
            <ErrorMessage role="alert">{errorMessage}</ErrorMessage>
          )}

          <Actions>
            <SecondaryButton type="button" onClick={closeDialog}>
              취소
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장하기'}
            </PrimaryButton>
          </Actions>
        </Form>
      </Panel>
      <KakaoPlaceSearchDialog
        open={isPlaceSearchOpen}
        analyticsContext="profile_preferred_area"
        title="선호 거래 지역 선택"
        description="자주 거래하고 싶은 지하철역이나 장소를 검색해 주세요."
        onClose={() => setIsPlaceSearchOpen(false)}
        onSelect={selectTradeLocation}
      />
    </Dialog>
  );
}

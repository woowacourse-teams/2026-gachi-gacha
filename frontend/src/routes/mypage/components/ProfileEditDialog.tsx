import { type FormEvent, useEffect, useRef, useState } from 'react';

import type { UpdateCurrentMemberInput } from '@/features/auth/api/updateCurrentMember';
import type { AuthMember } from '@/features/auth/authMemberType';
import { KakaoPlaceSearchDialog } from '@/features/placeSearch/KakaoPlaceSearchDialog';
import type { PlaceSearchSelection } from '@/features/placeSearch/placeSearchType';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import type { ProfileTradeLocationChange } from '@/shared/analytics/analyticsEventType';

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
  Input,
  InteractiveField,
  Panel,
  PlaceSearchAction,
  PlaceSelectButton,
  PlaceSelection,
  PlaceSelectionAddress,
  PlaceSelectionName,
  PrimaryButton,
  SecondaryButton,
  Title,
} from './AccountDialog.styles';

const MAX_FIELD_LENGTH = 255;

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
      setErrorMessage(null);
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [member.desireTradeLocation, member.nickname, open]);

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

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSave({
        nickname: normalizedNickname,
        profileImageUrl: member.profileImageUrl,
        desireTradeLocation: normalizedLocation || null,
      });
      captureAnalyticsEvent('profile_update_completed', {
        outcome: 'success',
        has_trade_location: Boolean(normalizedLocation),
        trade_location_change: tradeLocationChange,
      });
      onSaved?.();
      dialogRef.current?.close();
    } catch (error) {
      captureAnalyticsEvent('profile_update_completed', {
        outcome: 'failure',
        has_trade_location: Boolean(normalizedLocation),
        trade_location_change: tradeLocationChange,
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

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import {
  isLaunchEventDate,
  type LaunchEventMetadata,
} from '@/features/launchEvent/launchEventConfig';
import {
  type LaunchEventInput,
  type LaunchEventReceipt,
  submitLaunchEvent,
} from '@/features/launchEvent/launchEventSubmission';

import * as S from './LaunchEventForm.styles';

interface LaunchEventFormProps {
  memberId: string;
  metadata: LaunchEventMetadata;
  endpoint: string;
  onSuccess: (receipt: LaunchEventReceipt) => void;
  onBack: () => void;
  onPendingChange?: (pending: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

type PhotoPreview = { file: File; url: string };
type TermsKind = 'privacy' | 'rules';
type TextField = 'name' | 'phone' | 'reason';
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

function readPhoto(
  file: File,
): Promise<NonNullable<LaunchEventInput['photos']>[number]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result;
      if (typeof value !== 'string' || !value.includes(';base64,')) {
        reject(new Error('사진을 읽지 못했어요. 사진을 다시 선택해 주세요.'));
        return;
      }
      resolve({
        name: file.name,
        mimeType: file.type,
        data: value.split(',')[1] ?? '',
      });
    };
    reader.onerror = () =>
      reject(new Error('사진을 읽지 못했어요. 사진을 다시 선택해 주세요.'));
    reader.readAsDataURL(file);
  });
}

/** 헤더/라우팅은 부모가 담당한다. 입력·사진은 컴포넌트 메모리에만 보관한다. */
export function LaunchEventForm({
  memberId,
  metadata,
  endpoint,
  onSuccess,
  onPendingChange,
  onDirtyChange,
}: LaunchEventFormProps) {
  const id = useId();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [rulesConsent, setRulesConsent] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<TextField, boolean>>>(
    {},
  );
  const [photoError, setPhotoError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [terms, setTerms] = useState<TermsKind | null>(null);
  const [pending, setPending] = useState(false);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const attempt = useRef<{ fingerprint: string; submissionId: string } | null>(
    null,
  );
  const photoInput = useRef<HTMLInputElement>(null);
  const addPhotoButton = useRef<HTMLButtonElement>(null);
  const photoUrls = useRef(new Set<string>());
  const allConsent = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const termsOpener = useRef<HTMLButtonElement | null>(null);
  const errorElement = useRef<HTMLParagraphElement>(null);
  const normalizedPhone = phone.replace(/[\s-]/g, '');
  const nameError =
    !name.trim() || name.trim().length > 80
      ? '이름을 1~80자로 입력해 주세요.'
      : '';
  const phoneError = !/^01(?:0\d{8}|[16789]\d{7,8})$/.test(normalizedPhone)
    ? '연락 가능한 휴대전화 번호를 10~11자리로 입력해 주세요.'
    : '';
  const reasonError =
    reason.trim().length < 10 || reason.trim().length > 300
      ? '응모 사연을 앞뒤 공백을 제외하고 10~300자로 입력해 주세요.'
      : '';
  const valid =
    !nameError && !phoneError && !reasonError && privacyConsent && rulesConsent;
  const dirty = Boolean(
    name || phone || reason || photos.length || privacyConsent || rulesConsent,
  );

  useEffect(() => {
    mounted.current = true;
    const urls = photoUrls.current;
    return () => {
      mounted.current = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  useEffect(() => {
    if (!dirty && !pending) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty, pending]);

  useEffect(() => {
    if (allConsent.current)
      allConsent.current.indeterminate = privacyConsent !== rulesConsent;
  }, [privacyConsent, rulesConsent]);

  useEffect(() => {
    if (!terms) return;
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    return () => {
      element.close();
      termsOpener.current?.focus();
    };
  }, [terms]);

  useEffect(() => {
    if (submitError) errorElement.current?.focus();
  }, [submitError]);

  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (inFlight.current || !files.length) return;
    if (photos.length + files.length > 3) {
      setPhotoError('사진은 최대 3장까지 선택할 수 있어요.');
      return;
    }
    if (
      files.some(
        (file) =>
          !PHOTO_TYPES.has(file.type) ||
          file.size === 0 ||
          file.size > MAX_PHOTO_SIZE,
      )
    ) {
      setPhotoError(
        '사진 한 장당 5MB 이하의 JPG, PNG, WebP 파일만 선택해 주세요.',
      );
      return;
    }
    const additions = files.map((file) => {
      const url = URL.createObjectURL(file);
      photoUrls.current.add(url);
      return { file, url };
    });
    setPhotos((current) => [...current, ...additions]);
    setPhotoError('');
  };

  const removePhoto = (url: string) => {
    if (inFlight.current) return;
    URL.revokeObjectURL(url);
    photoUrls.current.delete(url);
    setPhotos((current) => current.filter((photo) => photo.url !== url));
    setPhotoError('');
    requestAnimationFrame(() => addPhotoButton.current?.focus());
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    setTouched({ name: true, phone: true, reason: true });
    if (!valid) return;
    const now = Date.now();
    if (
      !metadata.accepting ||
      !memberId.trim() ||
      !isLaunchEventDate(metadata.startAt) ||
      !isLaunchEventDate(metadata.endAt) ||
      now < Date.parse(metadata.startAt) ||
      now >= Date.parse(metadata.endAt)
    ) {
      setSubmitError(
        '지금은 응모할 수 없어요. 이벤트 기간과 로그인 상태를 다시 확인해 주세요.',
      );
      return;
    }
    inFlight.current = true;
    setPending(true);
    setSubmitError('');
    try {
      const fingerprint = JSON.stringify({
        memberId,
        endpoint,
        name: name.trim(),
        phone: normalizedPhone,
        reason: reason.trim(),
        photos: photos.map((photo) => photo.url),
        rulesVersion: metadata.rulesVersion,
      });
      if (!attempt.current || attempt.current.fingerprint !== fingerprint) {
        attempt.current = { fingerprint, submissionId: crypto.randomUUID() };
      }
      const encodedPhotos = await Promise.all(
        photos.map(({ file }) => readPhoto(file)),
      );
      if (!mounted.current) return;
      if (Date.now() >= Date.parse(metadata.endAt)) {
        setSubmitError(
          '응모 기간이 종료되었어요. 입력한 정보는 전송하지 않았어요.',
        );
        return;
      }
      const receipt = await submitLaunchEvent(
        {
          submissionId: attempt.current.submissionId,
          memberId,
          name: name.trim(),
          phone: normalizedPhone,
          reason: reason.trim(),
          privacyConsent: true,
          rulesConsent: true,
          rulesVersion: metadata.rulesVersion,
          photos: encodedPhotos,
        },
        endpoint,
      );
      if (mounted.current) {
        // 완료 콜백이 폼을 바로 제거해도 부모의 접수 중 잠금은 남기지 않는다.
        onPendingChange?.(false);
        onSuccess(receipt);
      }
    } catch {
      if (mounted.current)
        setSubmitError(
          '응모 접수 결과를 확인하지 못했어요. 입력 내용을 유지한 채 다시 시도해 주세요.',
        );
    } finally {
      inFlight.current = false;
      if (mounted.current) setPending(false);
    }
  };

  const blur = (field: TextField) =>
    setTouched((current) => ({ ...current, [field]: true }));
  const openTerms = (kind: TermsKind, opener: HTMLButtonElement) => {
    termsOpener.current = opener;
    setTerms(kind);
  };

  return (
    <S.Form
      className="ph-no-capture ph-mask"
      data-private
      data-sentry-mask
      aria-label="가치가챠 이벤트 응모"
      aria-busy={pending}
      noValidate
      onSubmit={submit}
    >
      <S.Summary>
        <strong>가치가챠 앱 출시 기념 가챠 선물 이벤트</strong>
        <p>총 8명 추첨 · 1인 1개 랜덤 증정</p>
        <p>
          앱 설치와 게시글 1개 작성을 마친 회원이 응모할 수 있어요. 참여 조건은
          운영진이 확인해요.
        </p>
      </S.Summary>

      <S.Field>
        <S.Label htmlFor={`${id}-name`}>
          이름<S.Required aria-hidden="true">*</S.Required>
        </S.Label>
        <S.Input
          id={`${id}-name`}
          name="name"
          autoComplete="name"
          maxLength={80}
          required
          disabled={pending}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => blur('name')}
          aria-invalid={Boolean(touched.name && nameError)}
          aria-describedby={
            touched.name && nameError ? `${id}-name-error` : undefined
          }
        />
        {touched.name && nameError && (
          <S.ErrorText id={`${id}-name-error`}>{nameError}</S.ErrorText>
        )}
      </S.Field>

      <S.Field>
        <S.Label htmlFor={`${id}-phone`}>
          연락처<S.Required aria-hidden="true">*</S.Required>
        </S.Label>
        <S.Input
          id={`${id}-phone`}
          name="tel"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          required
          disabled={pending}
          placeholder="010-1234-5678"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          onBlur={() => blur('phone')}
          aria-invalid={Boolean(touched.phone && phoneError)}
          aria-describedby={`${id}-phone-hint${touched.phone && phoneError ? ` ${id}-phone-error` : ''}`}
        />
        <S.Hint id={`${id}-phone-hint`}>당첨 안내를 받을 번호예요.</S.Hint>
        {touched.phone && phoneError && (
          <S.ErrorText id={`${id}-phone-error`}>{phoneError}</S.ErrorText>
        )}
      </S.Field>

      <S.Field>
        <S.Label htmlFor={`${id}-reason`}>
          응모 사연<S.Required aria-hidden="true">*</S.Required>
        </S.Label>
        <S.Textarea
          id={`${id}-reason`}
          name="reason"
          maxLength={300}
          required
          disabled={pending}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          onBlur={() => blur('reason')}
          aria-invalid={Boolean(touched.reason && reasonError)}
          aria-describedby={`${id}-reason-hint${touched.reason && reasonError ? ` ${id}-reason-error` : ''}`}
        />
        <S.Hint id={`${id}-reason-hint`}>
          10~300자로 작성해 주세요. 주소 등 불필요한 개인정보는 적지 말아
          주세요.
        </S.Hint>
        <S.Counter aria-hidden="true">{reason.length}/300</S.Counter>
        {touched.reason && reasonError && (
          <S.ErrorText id={`${id}-reason-error`}>{reasonError}</S.ErrorText>
        )}
      </S.Field>

      <S.Field>
        <S.Label as="p" id={`${id}-photos`}>
          인증 사진<S.Optional>선택 · 최대 3장</S.Optional>
        </S.Label>
        <S.Hint id={`${id}-photo-hint`}>
          한 장당 5MB 이하의 JPG, PNG, WebP. 다른 사람의 얼굴·연락처·주소는 가려
          주세요.
        </S.Hint>
        <input
          ref={photoInput}
          type="file"
          hidden
          multiple
          disabled={pending}
          accept="image/jpeg,image/png,image/webp"
          aria-label="인증 사진 파일 선택"
          onChange={addPhotos}
        />
        <S.PhotoRow role="group" aria-labelledby={`${id}-photos`}>
          {photos.map((photo, index) => (
            <S.Photo key={photo.url}>
              <img src={photo.url} alt={`선택한 인증 사진 ${index + 1}`} />
              <S.RemovePhoto
                type="button"
                disabled={pending}
                aria-label={`인증 사진 ${index + 1} 삭제`}
                onClick={() => removePhoto(photo.url)}
              >
                <span aria-hidden="true">×</span>
              </S.RemovePhoto>
            </S.Photo>
          ))}
          <S.AddPhoto
            ref={addPhotoButton}
            type="button"
            disabled={pending || photos.length >= 3}
            aria-describedby={`${id}-photo-hint`}
            onClick={() => photoInput.current?.click()}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M4 7h4l2-3h4l2 3h4v13H4z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            사진 추가 ({photos.length}/3)
          </S.AddPhoto>
        </S.PhotoRow>
        {photoError && <S.ErrorText role="alert">{photoError}</S.ErrorText>}
      </S.Field>

      <S.ConsentCard disabled={pending}>
        <S.Hidden as="legend">필수 동의</S.Hidden>
        <S.ConsentRow>
          <label>
            <input
              ref={allConsent}
              type="checkbox"
              checked={privacyConsent && rulesConsent}
              onChange={(event) => {
                setPrivacyConsent(event.target.checked);
                setRulesConsent(event.target.checked);
              }}
            />
            전체 동의
          </label>
        </S.ConsentRow>
        <S.ConsentRow>
          <label>
            <input
              type="checkbox"
              required
              checked={privacyConsent}
              onChange={(event) => setPrivacyConsent(event.target.checked)}
            />
            [필수] 개인정보 수집·이용 동의
          </label>
          <S.TermsButton
            type="button"
            aria-label="개인정보 수집·이용 내용 보기"
            onClick={(event) => openTerms('privacy', event.currentTarget)}
          >
            보기
          </S.TermsButton>
        </S.ConsentRow>
        <S.ConsentRow>
          <label>
            <input
              type="checkbox"
              required
              checked={rulesConsent}
              onChange={(event) => setRulesConsent(event.target.checked)}
            />
            [필수] 참여 조건·유의사항 확인
          </label>
          <S.TermsButton
            type="button"
            aria-label="참여 조건·유의사항 보기"
            onClick={(event) => openTerms('rules', event.currentTarget)}
          >
            보기
          </S.TermsButton>
        </S.ConsentRow>
      </S.ConsentCard>
      {submitError && (
        <S.ErrorText ref={errorElement} tabIndex={-1} role="alert">
          {submitError}
        </S.ErrorText>
      )}

      <S.Footer>
        <S.SubmitButton type="submit" disabled={!valid || pending}>
          {pending ? '접수 확인 중…' : '응모하기'}
        </S.SubmitButton>
        <p role="status">
          {pending
            ? '접수가 끝날 때까지 화면을 닫지 말아 주세요.'
            : '필수 항목 작성과 동의 후 응모할 수 있어요.'}
        </p>
      </S.Footer>

      {terms && (
        <S.TermsDialog
          ref={dialog}
          aria-labelledby={`${id}-terms-title`}
          onCancel={(event) => {
            event.preventDefault();
            setTerms(null);
          }}
        >
          <h2 id={`${id}-terms-title`}>
            {terms === 'privacy'
              ? '개인정보 수집·이용 동의'
              : '참여 조건·유의사항'}
          </h2>
          {terms === 'privacy' ? (
            <>
              <p>개인정보 처리자: {metadata.privacy.controller}</p>
              <p>문의: {metadata.privacy.contact}</p>
              <p>이용 목적: {metadata.privacy.purpose}</p>
              <p>수집 항목: {metadata.privacy.items.join(', ')}</p>
              <p>
                보유 기간: 응모 접수일로부터 {metadata.privacy.retentionDays}일.
                보유 기간이 지나면 응모 정보와 첨부 사진을 파기해요.
              </p>
              <p>
                동의를 거부할 수 있지만, 거부하면 이벤트에 응모할 수 없어요.
                사진은 선택 항목이며 첨부하지 않아도 응모할 수 있어요.
              </p>
            </>
          ) : (
            <ul>
              <li>
                가치가챠 앱을 설치하고 게시글을 1개 이상 작성한 회원이 참여할 수
                있어요. 동의는 참여 조건을 충족했다는 본인의 확인이며, 운영진이
                추후 확인해요.
              </li>
              <li>
                앱 설치와 게시글 작성만으로 응모가 완료되지 않아요. 응모 완료
                화면까지 확인해 주세요.
              </li>
              <li>
                총 8명을 추첨해 가챠 4종 중 1개를 무작위로 지급해요. 종류는
                선택할 수 없고 중복 당첨은 제외해요.
              </li>
              <li>
                선택 사진에는 본인에게 이용 권한이 있는 자료만 올려 주세요. 허위
                정보나 타인의 정보로는 응모할 수 없어요.
              </li>
              <li>
                가치가챠가 구매한 정품 경품을 제공하는 자체 이벤트이며, 캐릭터
                권리자 및 제조·판매사와의 공식 협업·후원과는 무관해요.
              </li>
            </ul>
          )}
          <S.SubmitButton type="button" onClick={() => setTerms(null)}>
            확인
          </S.SubmitButton>
        </S.TermsDialog>
      )}
    </S.Form>
  );
}

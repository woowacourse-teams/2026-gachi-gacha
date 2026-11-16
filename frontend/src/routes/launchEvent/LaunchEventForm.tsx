import { type FormEvent, useEffect, useId, useRef, useState } from 'react';

import { collectLaunchEventParticipation } from '@/features/launchEvent/collectLaunchEventParticipation';
import {
  isLaunchEventDate,
  type LaunchEventMetadata,
} from '@/features/launchEvent/launchEventConfig';
import { getLaunchEventPlatform } from '@/features/launchEvent/launchEventPlatform';
import {
  isLaunchEventInstagramId,
  type LaunchEventReceipt,
  normalizeLaunchEventInstagramId,
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

type TermsKind = 'privacy' | 'rules';
type TextField = 'name' | 'instagramId';

/** 헤더/라우팅은 부모가 담당한다. 입력은 컴포넌트 메모리에만 보관한다. */
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
  const [instagramId, setInstagramId] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [rulesConsent, setRulesConsent] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<TextField, boolean>>>(
    {},
  );
  const [submitError, setSubmitError] = useState('');
  const [terms, setTerms] = useState<TermsKind | null>(null);
  const [pending, setPending] = useState(false);
  const pendingChangeCallback = useRef(onPendingChange);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const attempt = useRef<{ fingerprint: string; submissionId: string } | null>(
    null,
  );
  const allConsent = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const termsOpener = useRef<HTMLButtonElement | null>(null);
  const errorElement = useRef<HTMLParagraphElement>(null);
  const normalizedInstagramId = normalizeLaunchEventInstagramId(instagramId);
  const nameError =
    !name.trim() || name.trim().length > 80
      ? '이름을 1~80자로 입력해 주세요.'
      : '';
  const instagramIdError = !isLaunchEventInstagramId(instagramId)
    ? '인스타그램 아이디를 영문·숫자·밑줄·마침표로 1~30자 입력해 주세요.'
    : '';
  const valid =
    !nameError && !instagramIdError && privacyConsent && rulesConsent;
  const dirty = Boolean(name || instagramId || privacyConsent || rulesConsent);

  useEffect(() => {
    pendingChangeCallback.current = onPendingChange;
  }, [onPendingChange]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // 인증 만료 등으로 폼이 제거되어도 부모 화면의 접수 잠금을 해제한다.
      pendingChangeCallback.current?.(false);
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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    setTouched({ name: true, instagramId: true });
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
    let participationConfirmed = false;
    try {
      const participation = await collectLaunchEventParticipation(memberId);
      if (!mounted.current) return;
      if (participation.tradeIds.length === 0) {
        setSubmitError('게시글을 1개 이상 작성한 뒤 다시 응모해 주세요.');
        return;
      }
      participationConfirmed = true;
      const input = {
        memberId: participation.memberId,
        name: name.trim(),
        instagramId: normalizedInstagramId,
        tradeIds: participation.tradeIds,
        privacyConsent: true as const,
        rulesConsent: true as const,
        rulesVersion: metadata.rulesVersion,
        // 구버전 GAS는 추가 필드를 거절한다. 지원 응답이 있을 때만 전송한다.
        ...(metadata.capabilities?.participationPlatform
          ? { participationPlatform: getLaunchEventPlatform() }
          : {}),
      };
      const fingerprint = JSON.stringify({ endpoint, ...input });
      if (!attempt.current || attempt.current.fingerprint !== fingerprint) {
        attempt.current = { fingerprint, submissionId: crypto.randomUUID() };
      }
      if (Date.now() >= Date.parse(metadata.endAt)) {
        setSubmitError(
          '응모 기간이 종료되었어요. 입력한 정보는 전송하지 않았어요.',
        );
        return;
      }
      const receipt = await submitLaunchEvent(
        {
          submissionId: attempt.current.submissionId,
          ...input,
        },
        endpoint,
      );
      if (mounted.current) {
        setName('');
        setInstagramId('');
        setPrivacyConsent(false);
        setRulesConsent(false);
        setTouched({});
        attempt.current = null;
        // 완료 콜백이 폼을 바로 제거해도 부모의 접수 중 잠금은 남기지 않는다.
        onPendingChange?.(false);
        onSuccess(receipt);
      }
    } catch {
      if (mounted.current)
        setSubmitError(
          participationConfirmed
            ? '응모 접수 결과를 확인하지 못했어요. 입력 내용을 유지한 채 다시 시도해 주세요.'
            : '로그인 상태와 게시글 참여 활동을 확인하지 못했어요. 입력 내용을 유지한 채 로그인과 게시글을 확인한 뒤 다시 시도해 주세요.',
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
        <p>
          가치가챠에서 교환 이야기를 활발하게 나눌수록, 선물을 만날 기회도
          커져요.
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
        <S.Label htmlFor={`${id}-instagram-id`}>
          인스타그램 아이디<S.Required aria-hidden="true">*</S.Required>
        </S.Label>
        <S.Input
          id={`${id}-instagram-id`}
          name="instagramId"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={31}
          required
          disabled={pending}
          placeholder="@gachigacha"
          value={instagramId}
          onChange={(event) => setInstagramId(event.target.value)}
          onBlur={() => blur('instagramId')}
          aria-invalid={Boolean(touched.instagramId && instagramIdError)}
          aria-describedby={`${id}-instagram-hint${touched.instagramId && instagramIdError ? ` ${id}-instagram-error` : ''}`}
        />
        <S.Hint id={`${id}-instagram-hint`}>
          당첨 안내를 받을 아이디예요. 프로필 주소 대신 아이디를 입력해 주세요.
        </S.Hint>
        {touched.instagramId && instagramIdError && (
          <S.ErrorText id={`${id}-instagram-error`}>
            {instagramIdError}
          </S.ErrorText>
        )}
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
                보유 기간: 경품 전달 완료 후 지체 없이 삭제하며, 최대 이벤트
                종료 후 {metadata.privacy.retentionDays}일까지 보관해요.
              </p>
              <p>
                동의를 거부할 수 있지만, 거부하면 이벤트에 응모할 수 없어요.
                다른 서비스 기능 이용에는 영향을 주지 않아요.
              </p>
              <p>
                응모 정보는 Google 스프레드시트에 저장해요. 관련 처리위탁·국외
                이전 사항은{' '}
                <a href="/privacy" target="_blank" rel="noreferrer">
                  개인정보처리방침(새 창)
                </a>
                에서 확인할 수 있어요.
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
                게시글 참여 활동을 추첨에 반영해요. 재응모는 횟수가 아니라
                마지막 응모 시점의 활동으로 갱신돼요.
              </li>
              <li>
                앱 설치와 게시글 작성만으로 응모가 완료되지 않아요. 응모 완료
                화면까지 확인해 주세요.
              </li>
              <li>
                총 8명을 추첨해 가챠 4종 중 1개를 무작위로 지급해요. 종류는
                선택할 수 없고 중복 당첨은 제외해요.
              </li>
              <li>허위 정보나 타인의 정보로는 응모할 수 없어요.</li>
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

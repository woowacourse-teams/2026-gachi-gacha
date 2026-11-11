import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { createLoginUrl } from '@/features/auth/authReturnPath';
import { useAuthSession } from '@/features/auth/AuthSessionContext';
import {
  getLaunchEventAvailability,
  getLaunchEventReadiness,
  LAUNCH_EVENT_CONFIG,
  type LaunchEventConfig,
  type LaunchEventMetadata,
} from '@/features/launchEvent/launchEventConfig';
import {
  formatLaunchEventDate,
  getLaunchEventDday,
  LAUNCH_EVENT_CONTENT as content,
  LAUNCH_EVENT_PATH,
} from '@/features/launchEvent/launchEventContent';
import {
  fetchLaunchEventMetadata,
  type LaunchEventReceipt,
} from '@/features/launchEvent/launchEventSubmission';
import { useLaunchEventClock } from '@/features/launchEvent/useLaunchEventClock';

import { LaunchEventForm } from './LaunchEventForm';
import * as S from './route.styles';

function LoginDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const opener = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return (
    <S.Dialog ref={ref} aria-labelledby="launch-login-title" onCancel={onClose}>
      <h2 id="launch-login-title">로그인이 필요해요</h2>
      <p>로그인한 뒤 이벤트 페이지에서 응모를 이어갈 수 있어요.</p>
      <div>
        <S.Secondary type="button" onClick={onClose}>
          닫기
        </S.Secondary>
        <S.Primary
          type="button"
          onClick={() => navigate(createLoginUrl(LAUNCH_EVENT_PATH))}
        >
          로그인
        </S.Primary>
      </div>
    </S.Dialog>
  );
}

export function LaunchEventRoute({
  config = LAUNCH_EVENT_CONFIG,
}: {
  config?: LaunchEventConfig;
}) {
  const navigate = useNavigate();
  const auth = useAuthSession();
  const now = useLaunchEventClock();
  const availability = getLaunchEventAvailability(config, now);
  const [metadata, setMetadata] = useState<LaunchEventMetadata | null>(null);
  const [metadataError, setMetadataError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [step, setStep] = useState<'detail' | 'apply' | 'complete'>('detail');
  const [receipt, setReceipt] = useState<LaunchEventReceipt | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ready = getLaunchEventReadiness(config, metadata, now);

  useEffect(() => {
    let active = true;
    if (availability !== 'open') return;
    fetchLaunchEventMetadata(config.endpoint).then(
      (value) => {
        if (active) {
          setMetadata(value);
          setMetadataError(false);
        }
      },
      () => {
        if (active) {
          setMetadata(null);
          setMetadataError(true);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [availability, config.endpoint, attempt]);

  useEffect(() => {
    const previous = document.title;
    document.title = `${step === 'apply' ? '이벤트 응모' : step === 'complete' ? '응모 완료' : content.shortTitle} | 가치가챠`;
    titleRef.current?.focus();
    return () => {
      document.title = previous;
    };
  }, [step]);

  const back = () => {
    if (pending) return;
    if (step === 'apply') {
      if (
        dirty &&
        !window.confirm(
          '작성 중인 내용이 저장되지 않아요. 이벤트 상세로 돌아갈까요?',
        )
      )
        return;
      setDirty(false);
      setStep('detail');
    } else navigate('/trade');
  };

  const apply = () => {
    if (!getLaunchEventReadiness(config, metadata, new Date())) return;
    if (auth.status === 'authenticated' && auth.memberId) setStep('apply');
    else setLoginOpen(true);
  };

  const share = async () => {
    const url = new URL(LAUNCH_EVENT_PATH, window.location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: content.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setShareMessage('이벤트 링크를 복사했어요.');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        setShareMessage('주소창의 이벤트 링크를 복사해 공유해 주세요.');
    }
  };

  const period = ['open', 'upcoming', 'closed'].includes(availability)
    ? `${formatLaunchEventDate(config.startAt)} ~ ${formatLaunchEventDate(new Date(Date.parse(config.endAt) - 1).toISOString())} (한국 시간)`
    : `시작일 추후 안내 · ${content.provisionalDeadline} 마감 예정`;
  const stateText =
    availability === 'closed'
      ? '응모가 마감되었어요'
      : availability === 'upcoming'
        ? '응모 시작 전이에요'
        : ready
          ? '응모하기'
          : '응모를 준비하고 있어요';

  return (
    <S.Page>
      <S.Shell>
        <S.Header>
          <S.IconButton
            type="button"
            aria-label={
              step === 'apply' ? '이벤트 상세로 돌아가기' : '홈으로 돌아가기'
            }
            disabled={pending}
            onClick={back}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m14 5-7 7 7 7" />
            </svg>
          </S.IconButton>
          <h1 ref={titleRef} tabIndex={-1}>
            {step === 'apply'
              ? '응모하기'
              : step === 'complete'
                ? '응모 완료'
                : '이벤트'}
          </h1>
          {step === 'detail' && (
            <S.IconButton
              type="button"
              aria-label="이벤트 공유"
              onClick={() => void share()}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="m9 10 6-3M9 14l6 3" />
              </svg>
            </S.IconButton>
          )}
        </S.Header>

        <main>
          {step === 'detail' && (
            <>
              <S.Hero>
                {content.prizeImage ? (
                  <img src={content.prizeImage} alt={content.prizeImageAlt} />
                ) : (
                  <span aria-hidden="true">🎁</span>
                )}
              </S.Hero>
              <S.Section aria-labelledby="launch-title">
                <S.Badge>
                  {availability === 'open'
                    ? '진행 중'
                    : availability === 'closed'
                      ? '마감'
                      : '준비 중'}
                </S.Badge>
                {availability === 'open' && (
                  <S.Badge>{getLaunchEventDday(config.endAt, now)}</S.Badge>
                )}
                <h2 id="launch-title">{content.title}</h2>
                <p>
                  가치가챠 출시를 함께 축하해 주세요! 추첨을 통해 총 8분께
                  가챠를 선물해 드려요.
                </p>
                <S.Info>
                  <dt>응모 기간</dt>
                  <dd>{period}</dd>
                  <dt>당첨 발표</dt>
                  <dd>{content.announcement} · 개별 연락</dd>
                  <dt>응모 자격</dt>
                  <dd>앱 설치와 게시글 1개 작성을 완료한 로그인 회원</dd>
                </S.Info>
              </S.Section>
              <S.Section aria-labelledby="launch-prize">
                <h3 id="launch-prize">어떤 선물인가요?</h3>
                <p>
                  <strong>{content.prizeCaption}</strong>
                </p>
                <p>
                  치이카와 데스크톱 피규어를 1인 1개 랜덤으로 드려요. 종류를
                  선택할 수 없으며 중복 당첨은 제외됩니다.
                </p>
                <S.PrizeGuide
                  src={content.prizeGuideImage}
                  alt={content.prizeGuideImageAlt}
                  width={1080}
                  height={1350}
                  loading="lazy"
                  decoding="async"
                />
              </S.Section>
              <S.Section aria-labelledby="launch-how">
                <h3 id="launch-how">이렇게 참여해 주세요</h3>
                <ol>
                  <li>가치가챠 앱을 설치해 주세요.</li>
                  <li>가치가챠에 게시글을 1개 작성해 주세요.</li>
                  <li>아래 응모 폼을 제출해 주세요.</li>
                </ol>
                <p>
                  앱 설치와 게시글 작성만으로는 응모가 완료되지 않아요. 응모
                  완료 화면까지 확인해 주세요.
                </p>
                <p>
                  참여 조건은 운영팀에서 확인합니다. 선택 사진에는 다른 사람의
                  개인정보가 나오지 않도록 주의해 주세요.
                </p>
              </S.Section>
              <S.Section aria-labelledby="launch-notes">
                <h3 id="launch-notes">꼭 확인해 주세요</h3>
                <ul>
                  <li>당첨자에게 입력하신 연락처로 연락드릴 예정입니다.</li>
                  <li>
                    중복 응모, 허위 정보 또는 참여 조건 미충족은 추첨에서 제외될
                    수 있습니다.
                  </li>
                  <li>일정이 변경되면 이벤트 페이지를 통해 안내합니다.</li>
                </ul>
                <p>
                  본 이벤트는 가치가챠가 직접 구매한 정품 상품을 경품으로
                  제공하는 자체 이벤트입니다. 치이카와 IP 권리자 및 상품
                  제조·판매사와의 공식 협업·후원과는 무관합니다.
                </p>
                <p>
                  경품은 별도로 제작한 상품이 아닌 시판 상품이며, 관련 캐릭터와
                  상표의 권리는 각 권리자에게 있습니다.
                </p>
              </S.Section>
              {metadataError && (
                <S.Notice role="alert">
                  접수 정보를 불러오지 못했어요.{' '}
                  <button
                    type="button"
                    onClick={() => setAttempt((value) => value + 1)}
                  >
                    다시 확인
                  </button>
                </S.Notice>
              )}
              {!ready && (
                <S.Notice>
                  접수 기간·개인정보 안내·응모 시스템 설정을 완료한 뒤 응모할 수
                  있습니다.
                </S.Notice>
              )}
              <S.Notice role="status">{shareMessage}</S.Notice>
              <S.Footer>
                <S.Primary
                  type="button"
                  disabled={!ready || auth.status === 'loading'}
                  onClick={apply}
                >
                  {auth.status === 'loading' && ready
                    ? '로그인 확인 중…'
                    : stateText}
                </S.Primary>
              </S.Footer>
            </>
          )}

          {step === 'apply' &&
            (auth.status === 'authenticated' &&
            auth.memberId &&
            metadata &&
            (ready || pending) ? (
              <div
                className="ph-no-capture ph-mask"
                data-private
                data-sentry-mask
              >
                <LaunchEventForm
                  key={auth.memberId}
                  memberId={auth.memberId}
                  metadata={metadata}
                  endpoint={config.endpoint}
                  onBack={back}
                  onPendingChange={setPending}
                  onDirtyChange={setDirty}
                  onSuccess={(value) => {
                    setReceipt(value);
                    setPending(false);
                    setDirty(false);
                    setStep('complete');
                  }}
                />
              </div>
            ) : (
              <S.Section>
                <h2>응모 가능 상태를 다시 확인해 주세요</h2>
                <p>로그인이 만료되었거나 응모 기간이 종료되었어요.</p>
                <S.Secondary type="button" onClick={() => setStep('detail')}>
                  이벤트 보기
                </S.Secondary>
              </S.Section>
            ))}

          {step === 'complete' && receipt && (
            <>
              <S.Complete>
                <span aria-hidden="true">🎉</span>
                <h2>응모가 완료됐어요</h2>
                <p>{content.announcement}에 당첨 여부를 안내드릴게요.</p>
                <S.Info>
                  <dt>이벤트</dt>
                  <dd>{content.shortTitle}</dd>
                  <dt>접수 일시</dt>
                  <dd>{formatLaunchEventDate(receipt.receivedAt)}</dd>
                  <dt>응모 번호</dt>
                  <dd>{receipt.submissionId}</dd>
                </S.Info>
                <p>응모 번호를 보관해 주세요.</p>
              </S.Complete>
              <S.Footer>
                <S.Secondary type="button" onClick={() => setStep('detail')}>
                  이벤트 보기
                </S.Secondary>
                <S.HomeLink to="/trade">홈으로</S.HomeLink>
              </S.Footer>
            </>
          )}
        </main>
        {loginOpen && <LoginDialog onClose={() => setLoginOpen(false)} />}
      </S.Shell>
    </S.Page>
  );
}

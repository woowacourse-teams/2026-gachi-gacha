import { type FormEvent, useState } from 'react';

import { useAuthSession } from '@/features/auth/AuthSessionContext';
import {
  EVENT_APPLICATION_CONFIG,
  type EventApplicationConfig,
  getEventApplicationAvailability,
} from '@/features/eventApplication/eventApplicationConfig';
import type {
  EventApplicationInput,
  EventApplicationTrack,
} from '@/features/eventApplication/eventApplicationType';
import { parseTradeReference } from '@/features/eventApplication/parseTradeReference';
import {
  submitEventApplication,
  type SubmitEventApplication,
} from '@/features/eventApplication/submitEventApplication';
import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { SUPPORT_INSTAGRAM_URL } from '@/shared/contact/supportContact';
import { AppHeader } from '@/shared/ui/AppHeader';

import {
  Actions,
  BackLink,
  ConsentLabel,
  ConsentNotice,
  EventBadge,
  EventSchedule,
  EventScheduleLabel,
  Field,
  FieldDescription,
  FieldLabel,
  Form,
  FormCard,
  GuideCard,
  GuideGrid,
  GuideNumber,
  GuideText,
  Header,
  Hero,
  InstagramLink,
  Input,
  Main,
  Page,
  PrivacyLink,
  SectionDescription,
  SectionTitle,
  StateCard,
  StateDescription,
  StateTitle,
  SubmitButton,
  SuccessLink,
  TrackCard,
  TrackDescription,
  TrackGrid,
  TrackLabel,
  TrackTitle,
} from './route.styles';

const EVENT_ID = 'popular-goods-giveaway-2026' as const;
const INSTAGRAM_ID_PATTERN = /^[A-Za-z0-9._]{1,30}$/;

const TRACK_OPTIONS = [
  {
    value: 'BASIC',
    title: '이벤트 A 트랙',
    description: '회원가입·인스타 팔로우·거래 게시글 1건으로 응모해요.',
  },
  {
    value: 'COMPLETED',
    title: '이벤트 B 트랙',
    description: 'A 트랙 조건에 실제 거래 완료 1건을 더해 응모해요.',
  },
] satisfies Array<{
  value: EventApplicationTrack;
  title: string;
  description: string;
}>;

const AVAILABILITY_CONTENT = {
  disabled: {
    title: '이벤트 응모를 준비하고 있어요',
    description: '응모 일정이 확정되면 마이페이지에서 알려드릴게요.',
  },
  upcoming: {
    title: '이벤트가 곧 시작돼요',
    description: '응모 기간이 시작되면 이 페이지에서 참여할 수 있어요.',
  },
  closed: {
    title: '이벤트 응모가 종료되었어요',
    description: '참여해 주셔서 감사합니다. 당첨 안내를 기다려 주세요.',
  },
  misconfigured: {
    title: '응모 접수를 준비하고 있어요',
    description: '접수 설정을 확인하고 있습니다. 잠시 후 다시 확인해 주세요.',
  },
} as const;

export interface EventApplicationRouteProps {
  config?: EventApplicationConfig;
  now?: Date;
  submitApplication?: SubmitEventApplication;
}

export function EventApplicationRoute({
  config = EVENT_APPLICATION_CONFIG,
  now = new Date(),
  submitApplication: submitApplicationProp,
}: EventApplicationRouteProps) {
  const { memberId } = useAuthSession();
  const availability = getEventApplicationAvailability(config, now);
  const [desiredTrack, setDesiredTrack] =
    useState<EventApplicationTrack | null>(null);
  const [instagramId, setInstagramId] = useState('');
  const [tradeLink, setTradeLink] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!memberId) {
      setErrorMessage('회원 정보를 확인하지 못했어요. 다시 로그인해 주세요.');
      return;
    }

    if (!desiredTrack) {
      setErrorMessage('희망 트랙을 선택해 주세요.');
      return;
    }

    const normalizedInstagramId = instagramId.trim().replace(/^@+/, '');

    if (!INSTAGRAM_ID_PATTERN.test(normalizedInstagramId)) {
      setErrorMessage('@를 제외한 올바른 인스타그램 ID를 입력해 주세요.');
      return;
    }

    const tradeReference = parseTradeReference(tradeLink);

    if (!tradeReference) {
      setErrorMessage('본인이 작성한 가치가챠 거래글 링크를 입력해 주세요.');
      return;
    }

    if (!privacyConsent) {
      setErrorMessage('개인정보처리방침에 동의해야 응모할 수 있어요.');
      return;
    }

    const input: EventApplicationInput = {
      eventId: EVENT_ID,
      memberId,
      desiredTrack,
      instagramId: normalizedInstagramId,
      tradeId: tradeReference.tradeId,
      tradeUrl: tradeReference.tradeUrl,
      privacyConsent: true,
    };
    const submitApplication =
      submitApplicationProp ??
      ((nextInput: EventApplicationInput) =>
        submitEventApplication(nextInput, config.endpoint));

    setIsSubmitting(true);

    try {
      await submitApplication(input);
      captureAnalyticsEvent('event_application_completed', {
        track: desiredTrack,
        outcome: 'success',
      });
      setIsSubmitted(true);
    } catch (error) {
      captureAnalyticsEvent('event_application_completed', {
        track: desiredTrack,
        outcome: 'failure',
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '이벤트 응모를 접수하지 못했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const unavailableContent =
    availability === 'open' ? null : AVAILABILITY_CONTENT[availability];

  return (
    <Page>
      <AppHeader currentPath="/mypage" />
      <Main>
        <BackLink to="/mypage">← 마이페이지로 돌아가기</BackLink>
        <Hero>
          <EventBadge>기간 한정 이벤트</EventBadge>
          <Header>가치가챠 굿즈 추첨 이벤트</Header>
          <SectionDescription>
            거래글을 등록하고 원하는 트랙에 응모해 보세요. 회원 ID는 로그인
            정보에서 자동으로 확인합니다.
          </SectionDescription>
          <EventSchedule aria-label="이벤트 일정">
            <li>
              <EventScheduleLabel>이벤트 시작</EventScheduleLabel>
              <strong>10/10 (토)</strong>
            </li>
            <li>
              <EventScheduleLabel>이벤트 마감</EventScheduleLabel>
              <strong>10/16 (금) 오후 11:59분</strong>
            </li>
            <li>
              <EventScheduleLabel>당첨자 라이브 발표</EventScheduleLabel>
              <strong>10/31 (토)</strong>
            </li>
          </EventSchedule>
        </Hero>

        <section aria-labelledby="event-guide-title">
          <SectionTitle id="event-guide-title">참여 방법</SectionTitle>
          <GuideGrid>
            <GuideCard>
              <GuideNumber>1</GuideNumber>
              <GuideText>
                <strong>회원가입</strong>
                <span>가치가챠 서비스에 회원가입</span>
              </GuideText>
            </GuideCard>
            <GuideCard>
              <GuideNumber>2</GuideNumber>
              <GuideText>
                <strong>인스타그램 팔로우</strong>
                <InstagramLink
                  href={SUPPORT_INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  가치가챠 공식 인스타 계정 팔로우
                </InstagramLink>
              </GuideText>
            </GuideCard>
            <GuideCard>
              <GuideNumber>3</GuideNumber>
              <GuideText>
                <strong>가챠 거래 글 등록</strong>
                <span>
                  짱박아둔 가챠 다들 하나씩 있잖아요? 이제 빛을 볼 차례입니다.
                </span>
              </GuideText>
            </GuideCard>
            <GuideCard>
              <GuideNumber>4</GuideNumber>
              <GuideText>
                <strong>응모 폼 제출</strong>
                <span>마이페이지 - 이벤트 응모에서 폼 입력해 제출하면 끝.</span>
              </GuideText>
            </GuideCard>
          </GuideGrid>
        </section>

        {unavailableContent ? (
          <StateCard role="status">
            <StateTitle>{unavailableContent.title}</StateTitle>
            <StateDescription>
              {unavailableContent.description}
            </StateDescription>
            <SuccessLink to="/mypage">마이페이지로 돌아가기</SuccessLink>
          </StateCard>
        ) : isSubmitted ? (
          <StateCard role="status">
            <StateTitle>이벤트 응모를 접수했어요!</StateTitle>
            <StateDescription>
              입력한 내용과 회원 활동을 확인한 뒤 추첨 대상에 반영할게요.
            </StateDescription>
            <SuccessLink to="/mypage">마이페이지로 돌아가기</SuccessLink>
          </StateCard>
        ) : (
          <FormCard>
            <SectionTitle>응모 정보</SectionTitle>
            <SectionDescription>
              모든 항목은 필수입니다. 기존에 작성한 거래글도 사용할 수 있어요.
            </SectionDescription>
            <Form onSubmit={handleSubmit} data-private>
              <fieldset>
                <FieldLabel as="legend">희망 트랙</FieldLabel>
                <TrackGrid>
                  {TRACK_OPTIONS.map((track) => (
                    <TrackLabel key={track.value}>
                      <input
                        type="radio"
                        name="desiredTrack"
                        value={track.value}
                        checked={desiredTrack === track.value}
                        onChange={() => setDesiredTrack(track.value)}
                      />
                      <TrackCard>
                        <TrackTitle>{track.title}</TrackTitle>
                        <TrackDescription>{track.description}</TrackDescription>
                      </TrackCard>
                    </TrackLabel>
                  ))}
                </TrackGrid>
              </fieldset>

              <Field>
                <FieldLabel htmlFor="event-instagram-id">
                  인스타그램 ID
                </FieldLabel>
                <Input
                  id="event-instagram-id"
                  value={instagramId}
                  maxLength={31}
                  autoComplete="off"
                  placeholder="예: gachi__.gacha"
                  onChange={(event) => setInstagramId(event.target.value)}
                  required
                />
                <FieldDescription>
                  @를 제외한 계정명을 입력해 주세요.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="event-trade-link">거래글 링크</FieldLabel>
                <Input
                  id="event-trade-link"
                  type="url"
                  value={tradeLink}
                  placeholder="https://gachigacha.kro.kr/trade/123"
                  onChange={(event) => setTradeLink(event.target.value)}
                  required
                />
                <FieldDescription>
                  본인이 작성한 가치가챠 거래글 주소를 입력해 주세요.
                </FieldDescription>
              </Field>

              <ConsentNotice>
                <strong>이벤트 응모 개인정보 수집·이용 안내</strong>
                <dl>
                  <div>
                    <dt>수집 항목</dt>
                    <dd>
                      회원 ID, 희망 트랙, 인스타그램 ID, 거래글 링크, 응모 시각
                    </dd>
                  </div>
                  <div>
                    <dt>이용 목적</dt>
                    <dd>응모 자격 확인, 추첨, 당첨 안내 및 경품 전달</dd>
                  </div>
                  <div>
                    <dt>보유기간</dt>
                    <dd>이벤트 당첨자 경품 전달 완료 후 지체 없이 삭제</dd>
                  </div>
                </dl>
                <p>
                  동의를 거부할 수 있으나, 필수 정보이므로 동의하지 않으면
                  이벤트에 응모할 수 없습니다.
                </p>
              </ConsentNotice>
              <ConsentLabel>
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(event) => setPrivacyConsent(event.target.checked)}
                  required
                />
                <span>
                  위 개인정보 수집·이용 안내와{' '}
                  <PrivacyLink href="/privacy" target="_blank" rel="noreferrer">
                    개인정보처리방침
                  </PrivacyLink>
                  을 확인했으며 이에 동의합니다.
                </span>
              </ConsentLabel>

              {errorMessage && (
                <StateDescription role="alert">{errorMessage}</StateDescription>
              )}

              <Actions>
                <SubmitButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '응모 접수 중...' : '응모 제출하기'}
                </SubmitButton>
              </Actions>
            </Form>
          </FormCard>
        )}
      </Main>
    </Page>
  );
}

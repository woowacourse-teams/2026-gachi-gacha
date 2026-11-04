import { useEffect } from 'react';

import { captureAnalyticsEvent } from '@/shared/analytics/analyticsClient';
import { AppHeader } from '@/shared/ui/AppHeader';

import { SERVICE_RELEASE_NOTES } from './releaseNotes';
import {
  BackLink,
  Eyebrow,
  Hero,
  HighlightList,
  Intro,
  LatestBadge,
  Main,
  Page,
  ReleaseCard,
  ReleaseHeader,
  ReleaseList,
  ReleaseMeta,
  ReleaseSourceLink,
  ReleaseSummary,
  ReleaseTitle,
  Title,
  Version,
} from './route.styles';

export function UpdatesRoute() {
  useEffect(() => {
    captureAnalyticsEvent('updates_page_viewed', {
      latest_visible_version: SERVICE_RELEASE_NOTES[0].version,
      release_count: SERVICE_RELEASE_NOTES.length,
    });
  }, []);

  return (
    <Page>
      <AppHeader currentPath="/updates" />
      <Main>
        <BackLink to="/mypage">← 마이페이지로 돌아가기</BackLink>
        <Hero>
          <Eyebrow>가치가챠 업데이트 소식</Eyebrow>
          <Title>조금씩 더 좋아지고 있어요</Title>
          <Intro>
            실제 운영에 공개된 새로운 기능과 사용 경험 개선을 모아 소개해요.
            개발 중인 내용은 공개 버전에 반영된 뒤 이곳에 추가합니다.
          </Intro>
        </Hero>

        <ReleaseList aria-label="서비스 업데이트 목록">
          {SERVICE_RELEASE_NOTES.map((release, index) => (
            <ReleaseCard key={release.version}>
              <ReleaseHeader>
                <div>
                  <ReleaseMeta>
                    <Version>{release.version}</Version>
                    <time dateTime={release.releasedAt}>
                      {release.releasedAtLabel}
                    </time>
                  </ReleaseMeta>
                  <ReleaseTitle>{release.title}</ReleaseTitle>
                </div>
                {index === 0 && <LatestBadge>최신 공개 버전</LatestBadge>}
              </ReleaseHeader>
              <ReleaseSummary>{release.summary}</ReleaseSummary>
              <HighlightList>
                {release.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </HighlightList>
              <ReleaseSourceLink
                href={release.releaseUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  captureAnalyticsEvent('release_notes_selected', {
                    version: release.version,
                    is_latest: index === 0,
                  })
                }
              >
                전체 변경 기록 보기
              </ReleaseSourceLink>
            </ReleaseCard>
          ))}
        </ReleaseList>
      </Main>
    </Page>
  );
}

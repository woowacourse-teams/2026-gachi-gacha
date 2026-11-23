package com.gachi.gacha.server.news.domain;

import static com.gachi.gacha.server.news.domain.NewsFixtures.news;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class NewsCandidateTest {

    private static final Long BATCH_ID = 10L;
    private static final String LINK = "https://x.com/chiikawashop_kr/status/2118131184446124112";
    private static final LocalDate COLLECTED_ON = LocalDate.of(2026, 11, 4);
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 9);

    @Nested
    @DisplayName("수집 결과로 후보 만들기")
    class Collected {

        @Test
        @DisplayName("조건으로 쓰는 값은 컬럼에, 보여주기만 하는 값은 detail 에 담는다")
        void mapsColumnsAndDetail() {
            CollectedNews news = candidateNews(NewsSection.KOREA_STORE, true, LocalDate.of(2026, 11, 12), null, LINK);

            NewsCandidate candidate = NewsCandidate.collected(BATCH_ID, news);

            assertThat(candidate.getBatchId()).isEqualTo(BATCH_ID);
            assertThat(candidate.getSection()).isEqualTo(NewsSection.KOREA_STORE);
            assertThat(candidate.getKind()).isEqualTo(NewsKind.RELEASE);
            assertThat(candidate.getStartDate()).isEqualTo(LocalDate.of(2026, 11, 12));
            assertThat(candidate.getReview()).isEqualTo(NewsReview.PUSH_TARGET);
            assertThat(candidate.linkKey()).isEqualTo("x:2118131184446124112");
            assertThat(candidate.detail()).isEqualTo(NewsFixtures.detail());
        }

        @Test
        @DisplayName("원본 게시 시각은 X 게시물 번호로 계산해 서버 시간대로 저장하고, X 게시물이 아니면 비워 둔다")
        void storesPostedAt() {
            NewsCandidate post = NewsCandidate.collected(BATCH_ID, candidateNews(NewsSection.KOREA_STORE, true, null, null, LINK));
            NewsCandidate page = NewsCandidate.collected(BATCH_ID,
                    candidateNews(NewsSection.OTHER_GOODS, true, null, null, "https://chiikawa-info.jp/ck_land.html"));

            assertThat(post.getPostedAt()).isEqualTo(
                    LocalDateTime.ofInstant(Instant.parse("2026-11-05T00:00:02.003Z"), ZoneId.systemDefault()));
            assertThat(page.getPostedAt()).isNull();
            assertThat(page.getReview()).isEqualTo(NewsReview.TAB_ONLY);
        }
    }

    @Nested
    @DisplayName("이월")
    class CarryOver {

        @Test
        @DisplayName("링크가 검증된 공개 대상이고 아직 끝나지 않았으면 이월할 수 있다")
        void eligibleWhenPublishableAndNotEnded() {
            NewsCandidate push = collected(NewsSection.KOREA_STORE, true, LocalDate.of(2026, 11, 12), null, LINK);
            NewsCandidate tabOnly = collected(NewsSection.JAPAN_OFFICIAL, true, null, TODAY, LINK);

            assertThat(push.isCarryOverEligible(TODAY)).isTrue();
            assertThat(tabOnly.isCarryOverEligible(TODAY)).isTrue();
        }

        @Test
        @DisplayName("그 사이에 끝난 소식, 확인 필요인 소식은 이월하지 않는다")
        void notEligibleWhenEndedOrNeedsCheck() {
            NewsCandidate endedSince = collected(NewsSection.KOREA_STORE, true,
                    LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 8), LINK);
            NewsCandidate needsCheck = collected(NewsSection.KOREA_STORE, null, LocalDate.of(2026, 11, 12), null, LINK);

            assertThat(endedSince.getReview()).isEqualTo(NewsReview.PUSH_TARGET);
            assertThat(endedSince.isEndedOn(TODAY)).isTrue();
            assertThat(endedSince.isCarryOverEligible(TODAY)).isFalse();
            assertThat(needsCheck.getReview()).isEqualTo(NewsReview.NEEDS_CHECK);
            assertThat(needsCheck.isCarryOverEligible(TODAY)).isFalse();
        }

        @Test
        @DisplayName("이월한 후보는 내용이 같고, 여러 번 넘어가도 처음 후보를 가리킨다")
        void carriesContentAndKeepsOrigin() {
            NewsCandidate original = collected(NewsSection.KOREA_STORE, true, LocalDate.of(2026, 11, 12), null, LINK);
            ReflectionTestUtils.setField(original, "id", 100L);

            NewsCandidate first = original.carryTo(11L);
            ReflectionTestUtils.setField(first, "id", 200L);
            NewsCandidate second = first.carryTo(12L);

            assertThat(first.getBatchId()).isEqualTo(11L);
            assertThat(second.getCarriedFromId()).isEqualTo(100L);
            assertThat(second.detail()).isEqualTo(original.detail());
            assertThat(second.getReview()).isEqualTo(original.getReview());
        }

        @Test
        @DisplayName("날짜가 없으면 제목의 종료라는 말로 끝났는지 판단한다")
        void endedByWords() {
            NewsCandidate candidate = NewsCandidate.collected(BATCH_ID, news(NewsSection.KOREA_STORE, NewsKind.NOTICE,
                    "예약 마감 안내", null, null, LINK, true, null));

            assertThat(candidate.isEndedOn(TODAY)).isTrue();
        }
    }

    private NewsCandidate collected(
            final NewsSection section,
            @Nullable final Boolean linkVerified,
            @Nullable final LocalDate startDate,
            @Nullable final LocalDate endDate,
            @Nullable final String link
    ) {
        return NewsCandidate.collected(BATCH_ID, candidateNews(section, linkVerified, startDate, endDate, link));
    }

    /**
     * 수집일(COLLECTED_ON) 기준 진행 상태를 실제 판단 규칙으로 채운다.
     */
    private CollectedNews candidateNews(
            final NewsSection section,
            @Nullable final Boolean linkVerified,
            @Nullable final LocalDate startDate,
            @Nullable final LocalDate endDate,
            @Nullable final String link
    ) {
        NewsTiming timing = NewsTiming.judge(startDate, endDate, "11월 12일 발매 리스트", "11/12(목)", COLLECTED_ON);
        return news(section, NewsKind.RELEASE, "11월 12일 발매 리스트", startDate, endDate, link, linkVerified, timing);
    }
}

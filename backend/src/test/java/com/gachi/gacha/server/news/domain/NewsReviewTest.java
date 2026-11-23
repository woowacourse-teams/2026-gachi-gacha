package com.gachi.gacha.server.news.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class NewsReviewTest {

    private static final String LINK = "https://x.com/chiikawashop_kr/status/2119700000000000000";

    @Test
    @DisplayName("링크가 검증된 한국 매장·온라인 소식만 푸시 대상이고, 나머지 구분은 탭에만 공개한다")
    void pushTargetOnlyForVerifiedKoreanNews() {
        assertThat(NewsReview.classify(NewsSection.KOREA_STORE, NewsTiming.UPCOMING, true, LINK))
                .isEqualTo(NewsReview.PUSH_TARGET);
        assertThat(NewsReview.classify(NewsSection.KOREA_ONLINE, NewsTiming.ONGOING, true, LINK))
                .isEqualTo(NewsReview.PUSH_TARGET);
        assertThat(NewsReview.classify(NewsSection.JAPAN_OFFICIAL, NewsTiming.UPCOMING, true, LINK))
                .isEqualTo(NewsReview.TAB_ONLY);
        assertThat(NewsReview.classify(NewsSection.OVERSEAS, NewsTiming.ONGOING, true, LINK))
                .isEqualTo(NewsReview.TAB_ONLY);
    }

    @Test
    @DisplayName("진행 상태를 알 수 없어도 끝나지 않았으면 공개 대상이다")
    void unknownTimingIsStillPublishable() {
        assertThat(NewsReview.classify(NewsSection.OTHER_GOODS, null, true, LINK)).isEqualTo(NewsReview.TAB_ONLY);
    }

    @Test
    @DisplayName("링크가 검증되지 않았거나 판단 보류이거나 비어 있으면 확인 필요다")
    void needsCheckWhenLinkNotConfirmed() {
        assertThat(NewsReview.classify(NewsSection.KOREA_STORE, NewsTiming.UPCOMING, false, LINK))
                .isEqualTo(NewsReview.NEEDS_CHECK);
        assertThat(NewsReview.classify(NewsSection.KOREA_STORE, NewsTiming.UPCOMING, null, LINK))
                .isEqualTo(NewsReview.NEEDS_CHECK);
        assertThat(NewsReview.classify(NewsSection.KOREA_STORE, NewsTiming.UPCOMING, true, " "))
                .isEqualTo(NewsReview.NEEDS_CHECK);
        assertThat(NewsReview.classify(NewsSection.KOREA_STORE, NewsTiming.UPCOMING, true, null))
                .isEqualTo(NewsReview.NEEDS_CHECK);
    }

    @Test
    @DisplayName("끝난 소식은 링크 검증과 상관없이 지난 소식이고, 공개 대상이 아니다")
    void endedFirst() {
        assertThat(NewsReview.classify(NewsSection.KOREA_STORE, NewsTiming.ENDED, null, ""))
                .isEqualTo(NewsReview.ENDED);
        assertThat(NewsReview.ENDED.isPublishable()).isFalse();
        assertThat(NewsReview.NEEDS_CHECK.isPublishable()).isFalse();
        assertThat(NewsReview.TAB_ONLY.isPublishable()).isTrue();
    }
}

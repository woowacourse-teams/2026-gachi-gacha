package com.gachi.gacha.server.news.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class NewsKindAndSectionTest {

    @ParameterizedTest
    @CsvSource({
            "release, 발매",
            "restock, 재입고",
            "preorder, 예약판매",
            "entry_reservation, 입장예약",
            "popup, 팝업",
            "lottery, 쿠지",
            "notice, 공지",
            "other, 기타"
    })
    @DisplayName("kind 는 허용된 영어 코드 8개를 받고, 푸시 문구에 쓸 표시 이름을 가진다")
    void acceptsKindCodes(final String value, final String label) {
        assertThat(NewsKind.from(value)).map(NewsKind::getLabel).contains(label);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"발매", "予約", "RELEASE", "reservation", " release"})
    @DisplayName("허용된 코드와 정확히 같지 않은 kind 는 비어 있다 (그 소식은 버린다)")
    void emptyForUnknownKinds(final String value) {
        assertThat(NewsKind.from(value)).isEmpty();
    }

    @Test
    @DisplayName("한국 매장·온라인과 일본 공식만 푸시 대상 구분이다")
    void onlyKoreanAndJapanOfficialSectionsArePushTargets() {
        assertThat(NewsSection.values())
                .filteredOn(NewsSection::isPushTarget)
                .containsExactlyInAnyOrder(NewsSection.KOREA_STORE, NewsSection.KOREA_ONLINE,
                        NewsSection.JAPAN_OFFICIAL);
    }

    @Test
    @DisplayName("공지와 기타를 뺀 종류가 푸시 대상 종류다")
    void noticeAndOtherAreNotPushTargetKinds() {
        assertThat(NewsKind.values())
                .filteredOn(kind -> !kind.isPushTarget())
                .containsExactlyInAnyOrder(NewsKind.NOTICE, NewsKind.OTHER);
    }

    @ParameterizedTest
    @ValueSource(strings = {"korea_store", "korea_online", "japan_official", "other_goods", "overseas"})
    @DisplayName("section 은 허용된 값 5개를 받는다")
    void acceptsSections(final String value) {
        assertThat(NewsSection.from(value)).map(NewsSection::getValue).contains(value);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"KOREA_STORE", "japan", "korea store"})
    @DisplayName("section 은 응답 값과 정확히 같을 때만 인정한다")
    void sectionMustMatchExactly(final String value) {
        assertThat(NewsSection.from(value)).isEmpty();
    }
}

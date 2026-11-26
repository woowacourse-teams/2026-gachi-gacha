package com.gachi.gacha.server.news.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class NewsLinkTest {

    @Nested
    @DisplayName("normalize")
    class Normalize {

        @ParameterizedTest
        @CsvSource({
                "https://x.com/chiikawa_kouhou/status/2118508673865551977, x:2118508673865551977",
                "https://twitter.com/chiikawa_kouhou/status/2118508673865551977?s=20, x:2118508673865551977",
                "https://x.com/i/status/2118508673865551977, x:2118508673865551977",
                "https://X.COM/Chiikawa/status/2118508673865551977/photo/1, x:2118508673865551977"
        })
        @DisplayName("X 게시물은 표기와 상관없이 게시물 번호로 비교한다")
        void usesStatusIdForXPosts(final String link, final String expected) {
            assertThat(NewsLink.normalize(link)).isEqualTo(expected);
        }

        @ParameterizedTest
        @CsvSource({
                "https://Chiikawa-Info.jp/ck_land.html?ref=x, https://chiikawa-info.jp/ck_land.html",
                "https://chiikawa-info.jp/ck_land.html/, https://chiikawa-info.jp/ck_land.html",
                "https://chiikawamarket.jp/collections/NEW/?a=1&b=2, https://chiikawamarket.jp/collections/new",
                "https://chiikawamarket.jp//, https://chiikawamarket.jp/"
        })
        @DisplayName("그 밖의 링크는 영문 소문자로 바꾸고 쿼리를 지운 뒤 끝 슬래시 하나만 지운다")
        void lowercasesAndStripsQueryAndTrailingSlash(final String link, final String expected) {
            assertThat(NewsLink.normalize(link)).isEqualTo(expected);
        }

        @Test
        @DisplayName("영문 외의 문자는 그대로 둔다 (jq ascii_downcase 와 같음)")
        void keepsNonAsciiCharacters() {
            assertThat(NewsLink.normalize("https://EXAMPLE.jp/ちいかわ/ÄB")).isEqualTo("https://example.jp/ちいかわ/Äb");
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("링크가 없으면 빈 문자열이다")
        void emptyWhenMissing(final String link) {
            assertThat(NewsLink.normalize(link)).isEmpty();
        }
    }

    @Nested
    @DisplayName("isHttp")
    class IsHttp {

        @ParameterizedTest
        @ValueSource(strings = {"https://x.com/a/status/1", "http://example.com"})
        @DisplayName("http 나 https 로 시작하면 참이다")
        void trueForHttpLinks(final String link) {
            assertThat(NewsLink.isHttp(link)).isTrue();
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"HTTPS://x.com/a/status/1", "x.com/a/status/1", " https://x.com"})
        @DisplayName("대문자 스킴이나 앞에 공백이 있으면 스크립트처럼 거짓이다")
        void falseOtherwise(final String link) {
            assertThat(NewsLink.isHttp(link)).isFalse();
        }
    }

    @Nested
    @DisplayName("postedAt")
    class PostedAt {

        @Test
        @DisplayName("X 게시물 번호로 UTC 게시 시각을 계산한다")
        void computesFromStatusId() {
            assertThat(NewsLink.postedAt("https://x.com/chiikawashop_kr/status/2117134618503926221"))
                    .contains(Instant.parse("2026-11-02T06:00:02.167Z"));
            assertThat(NewsLink.postedAt("https://twitter.com/i/status/2118508673865551977?s=20"))
                    .contains(Instant.parse("2026-11-06T01:00:02.494Z"));
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {
                "https://chiikawa-info.jp/ck_land.html",
                "https://example.com/status/2117134618503926221",
                "https://x.com/chiikawa_kouhou",
                "https://x.com/a/status/99999999999999999999999"
        })
        @DisplayName("X 게시물이 아니거나 번호를 읽을 수 없으면 비어 있다")
        void emptyWhenNotXPost(final String link) {
            assertThat(NewsLink.postedAt(link)).isEmpty();
        }
    }
}

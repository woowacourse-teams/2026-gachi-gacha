package com.gachi.gacha.server.news.domain;

import java.time.Instant;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.jspecify.annotations.Nullable;

/**
 * 소식 링크를 같은 게시물끼리 비교할 수 있게 정규화한다. 규칙은 수집 스크립트(grok_news_json.sh)의 norm 과 같다.
 *
 * <pre>
 * https://x.com/chiikawa_kouhou/status/123        -> x:123
 * https://twitter.com/i/status/123?s=20           -> x:123   (표기가 달라도 같은 게시물)
 * https://Chiikawa-Info.jp/ck_land.html/?ref=x    -> https://chiikawa-info.jp/ck_land.html
 * </pre>
 */
public final class NewsLink {

    private static final Pattern STATUS_ID = Pattern.compile("/status/([0-9]+)");
    private static final Pattern HTTP_PREFIX = Pattern.compile("^https?://");
    private static final Pattern X_HOST = Pattern.compile("^https?://(www\\.|mobile\\.)?(x|twitter)\\.com/");
    private static final String X_KEY_PREFIX = "x:";

    /**
     * X 게시물 번호(snowflake)의 시각 기준점. 번호를 22비트 오른쪽으로 밀고 더하면 UTC 밀리초가 된다.
     */
    private static final long TWITTER_EPOCH_MILLIS = 1288834974657L;
    private static final int TIMESTAMP_SHIFT = 22;

    private NewsLink() {
    }

    public static String normalize(@Nullable final String link) {
        if (link == null) {
            return "";
        }
        Matcher matcher = STATUS_ID.matcher(link);
        if (matcher.find()) {
            return X_KEY_PREFIX + matcher.group(1);
        }
        return asciiLowerCase(link)
                .replaceFirst("\\?.*$", "")
                .replaceFirst("/$", "");
    }

    /**
     * 스크립트는 http(s) 로 시작하는 링크끼리만 중복으로 본다. 대소문자를 구분하는 것까지 같다.
     */
    public static boolean isHttp(@Nullable final String link) {
        return link != null && HTTP_PREFIX.matcher(link).find();
    }

    /**
     * X 게시물이면 게시물 번호로 원본 게시 시각을 계산한다. X 가 아닌 페이지나 번호가 없는 링크는 비어 있다.
     */
    public static Optional<Instant> postedAt(@Nullable final String link) {
        if (link == null || !X_HOST.matcher(link).find()) {
            return Optional.empty();
        }
        Matcher matcher = STATUS_ID.matcher(link);
        if (!matcher.find()) {
            return Optional.empty();
        }
        try {
            long statusId = Long.parseLong(matcher.group(1));
            return Optional.of(Instant.ofEpochMilli((statusId >> TIMESTAMP_SHIFT) + TWITTER_EPOCH_MILLIS));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    /**
     * jq 의 ascii_downcase 와 같게 영문 대문자만 바꾼다. 다른 문자는 그대로 둔다.
     */
    private static String asciiLowerCase(final String value) {
        StringBuilder builder = new StringBuilder(value.length());
        for (int index = 0; index < value.length(); index++) {
            char character = value.charAt(index);
            builder.append(character >= 'A' && character <= 'Z' ? (char) (character + ('a' - 'A')) : character);
        }
        return builder.toString();
    }
}

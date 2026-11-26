package com.gachi.gacha.server.news.domain;

import java.util.Arrays;
import java.util.Optional;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;

/**
 * 어느 계정이 올렸는지가 아니라, 어디서 사고 어디로 배송되는지로 나눈 구분. 값은 Grok 응답의 section 그대로다.
 * 모든 구분이 탭에 공개되고, 한국 매장·온라인과 일본 공식만 푸시 대상이 된다. 푸시 대상인지는 소식 종류({@link NewsKind})도 함께 본다.
 */
@Getter
@RequiredArgsConstructor
public enum NewsSection {

    KOREA_STORE("korea_store", "한국 매장", true),
    KOREA_ONLINE("korea_online", "한국 온라인", true),
    JAPAN_OFFICIAL("japan_official", "일본 공식", true),
    OTHER_GOODS("other_goods", "기타 굿즈", false),
    OVERSEAS("overseas", "해외", false);

    private final String value;
    private final String label;
    private final boolean pushTarget;

    /**
     * 허용된 값이 아니면 비어 있다. 그 소식은 버리고 이유를 실행 보고에 남긴다.
     */
    public static Optional<NewsSection> from(@Nullable final String value) {
        return Arrays.stream(values())
                .filter(section -> section.value.equals(value))
                .findFirst();
    }
}

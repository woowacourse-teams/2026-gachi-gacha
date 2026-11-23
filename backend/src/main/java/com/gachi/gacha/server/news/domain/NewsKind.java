package com.gachi.gacha.server.news.domain;

import java.util.Arrays;
import java.util.Optional;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;

/**
 * 소식 종류. 값은 프롬프트(chiikawa-v2)가 허용한 영어 코드이고, 표시 이름은 푸시 문구와 슬랙에 쓴다.
 */
@Getter
@RequiredArgsConstructor
public enum NewsKind {

    RELEASE("release", "발매"),
    RESTOCK("restock", "재입고"),
    PREORDER("preorder", "예약판매"),
    ENTRY_RESERVATION("entry_reservation", "입장예약"),
    POPUP("popup", "팝업"),
    LOTTERY("lottery", "쿠지"),
    NOTICE("notice", "공지"),
    OTHER("other", "기타");

    private final String value;
    private final String label;

    /**
     * 허용된 값이 아니면 비어 있다. 그 소식은 버리고 이유를 실행 보고에 남긴다.
     */
    public static Optional<NewsKind> from(@Nullable final String value) {
        return Arrays.stream(values())
                .filter(kind -> kind.value.equals(value))
                .findFirst();
    }
}

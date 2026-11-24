package com.gachi.gacha.server.news.domain;

import java.util.Arrays;
import java.util.Optional;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;

/**
 * 소식 종류. 값은 프롬프트(chiikawa-v2)가 허용한 영어 코드이고, 표시 이름은 푸시 문구와 슬랙에 쓴다.
 * 구매·예약·방문처럼 사용자가 움직여야 하는 종류만 푸시 대상이고, 공지와 기타는 탭에만 공개한다.
 */
@Getter
@RequiredArgsConstructor
public enum NewsKind {

    RELEASE("release", "발매", true),
    RESTOCK("restock", "재입고", true),
    PREORDER("preorder", "예약판매", true),
    ENTRY_RESERVATION("entry_reservation", "입장예약", true),
    POPUP("popup", "팝업", true),
    LOTTERY("lottery", "쿠지", true),
    NOTICE("notice", "공지", false),
    OTHER("other", "기타", false);

    private final String value;
    private final String label;
    private final boolean pushTarget;

    /**
     * 허용된 값이 아니면 비어 있다. 그 소식은 버리고 이유를 실행 보고에 남긴다.
     */
    public static Optional<NewsKind> from(@Nullable final String value) {
        return Arrays.stream(values())
                .filter(kind -> kind.value.equals(value))
                .findFirst();
    }
}

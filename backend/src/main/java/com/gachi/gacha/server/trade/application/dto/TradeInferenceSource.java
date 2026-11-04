package com.gachi.gacha.server.trade.application.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 추론에 필요한 값만 담은 읽기 전용 스냅샷. 트랜잭션 밖(ES 검색)에서 엔티티를 쓰지 않도록 값으로 꺼내 둔다.
 *
 * @param keyword     불용어를 제거한 검색 텍스트
 * @param categoryIds 사용자가 입력한 카테고리 (비어 있을 수 있음)
 * @param readAt      글을 읽은 시각. inferredAt 으로 저장되어 재추론 대상 판단에 쓰인다.
 */
public record TradeInferenceSource(
        String keyword,
        List<Long> categoryIds,
        LocalDateTime readAt
) {
}

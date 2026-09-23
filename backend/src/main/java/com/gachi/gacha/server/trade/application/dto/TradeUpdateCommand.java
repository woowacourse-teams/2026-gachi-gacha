package com.gachi.gacha.server.trade.application.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

/**
 * 전체 교체(PUT) 요청이다. 여기 담긴 값이 곧 수정 후의 최종 상태이며, 비어 있는 선택 필드는 "유지"가 아니라 "비움"을 뜻한다.
 */
@Builder
public record TradeUpdateCommand(
        String title,
        List<Long> categoryIds,
        String description,
        String desiredProduction,
        String purchaseStoreAddress,
        String tradePlace,
        LocalDateTime availableTime
) {
}

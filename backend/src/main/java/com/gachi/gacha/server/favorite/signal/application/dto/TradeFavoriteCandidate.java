package com.gachi.gacha.server.favorite.signal.application.dto;

/** 관심 신호가 겹치는 사용자와 정렬용 점수. 점수는 확률이 아니라 상대적 관련도다. */
public record TradeFavoriteCandidate(
        Long memberId,
        double interestScore
) {
}

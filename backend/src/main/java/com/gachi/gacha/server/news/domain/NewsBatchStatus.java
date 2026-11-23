package com.gachi.gacha.server.news.domain;

/**
 * 수집 회차의 상태. 승인과 발송 상태는 그 기능을 만들 때 추가한다.
 *
 * <pre>
 * COLLECTING ─┬─ AWAITING_APPROVAL ─┬─ EXPIRED    (다음 수집이 시작됨)
 *             │                     └─ DISCARDED  ([다시 수집]으로 버림)
 *             ├─ NO_NEWS   (공개할 소식 없음)
 *             └─ FAILED    (모든 호출 실패, 또는 수집 중 서버가 멈춤)
 * </pre>
 */
public enum NewsBatchStatus {

    COLLECTING,
    AWAITING_APPROVAL,
    NO_NEWS,
    FAILED,
    EXPIRED,
    DISCARDED;

    /**
     * 다음 수집이 후보를 넘겨받는 회차. 실패가 이어져도 넘겨받은 후보가 사라지지 않도록 실패한 회차에서도 넘겨받는다.
     */
    public boolean isCarryOverSource() {
        return this == EXPIRED || this == FAILED;
    }
}

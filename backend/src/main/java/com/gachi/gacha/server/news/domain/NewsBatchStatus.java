package com.gachi.gacha.server.news.domain;

/**
 * 수집 회차의 상태.
 *
 * <pre>
 * COLLECTING ─┬─ AWAITING_APPROVAL ─┬─ APPROVED ─── SENDING ─┬─ SENT    (푸시 발송 호출을 마침)
 *             │                     │  (서로 다른 N명이      └─ FAILED  (발송 결과를 알 수 없음. 다시 보내지 않는다)
 *             │                     │   [승인]. 푸시 대상이
 *             │                     │   없으면 여기서 끝)
 *             │                     ├─ EXPIRED    (다음 수집이 시작됨)
 *             │                     └─ DISCARDED  ([다시 수집]으로 버림)
 *             ├─ NO_NEWS   (공개할 소식 없음)
 *             └─ FAILED    (모든 호출 실패, 또는 수집 중 서버가 멈춤)
 * </pre>
 *
 * <p>FAILED 는 수집이 실패한 경우와 발송이 실패한 경우에 모두 쓴다. 승인 시각이 있으면 발송 실패다.
 */
public enum NewsBatchStatus {

    COLLECTING,
    AWAITING_APPROVAL,
    APPROVED,
    SENDING,
    SENT,
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

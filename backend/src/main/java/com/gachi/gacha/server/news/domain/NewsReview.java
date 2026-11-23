package com.gachi.gacha.server.news.domain;

import org.jspecify.annotations.Nullable;

/**
 * 수집한 후보를 승인 요청에서 어떻게 다룰지 나눈 결과.
 *
 * <ul>
 *   <li>PUSH_TARGET: 링크가 검증된, 끝나지 않은 한국 매장·온라인 소식. 승인하면 탭에 공개하고 요약 푸시에 넣는다</li>
 *   <li>TAB_ONLY: 링크가 검증된, 끝나지 않은 그 밖의 소식. 승인하면 탭에만 공개한다</li>
 *   <li>NEEDS_CHECK: 링크가 비었거나 응답에서 확인되지 않은 소식. 공개도 푸시도 하지 않고 "확인 필요"로만 보여준다</li>
 *   <li>ENDED: 수집 시점에 이미 끝난 소식. 공개도 푸시도 하지 않고 "지난 소식"으로만 보여준다</li>
 * </ul>
 */
public enum NewsReview {

    PUSH_TARGET,
    TAB_ONLY,
    NEEDS_CHECK,
    ENDED;

    /**
     * @param linkVerified 링크 검증 결과. null 은 판단 보류이고 검증되지 않은 것으로 본다
     */
    public static NewsReview classify(
            final NewsSection section,
            @Nullable final NewsTiming timing,
            @Nullable final Boolean linkVerified,
            @Nullable final String link
    ) {
        if (timing == NewsTiming.ENDED) {
            return ENDED;
        }
        if (!Boolean.TRUE.equals(linkVerified) || link == null || link.isBlank()) {
            return NEEDS_CHECK;
        }
        return section.isPushTarget() ? PUSH_TARGET : TAB_ONLY;
    }

    public boolean isPublishable() {
        return this == PUSH_TARGET || this == TAB_ONLY;
    }
}

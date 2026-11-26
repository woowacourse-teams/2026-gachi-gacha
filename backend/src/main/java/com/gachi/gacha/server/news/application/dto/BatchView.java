package com.gachi.gacha.server.news.application.dto;

import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import java.util.List;
import java.util.Set;

/**
 * 슬랙 메시지를 다시 그리는 데 필요한 회차의 현재 모습.
 *
 * @param approverIds  승인한 사람의 슬랙 회원 ID (표가 들어온 순서)
 * @param excludedKeys 사람이 [제외]한 링크 키 (같은 주제 전체)
 */
public record BatchView(
        NewsBatch batch,
        List<NewsCandidate> candidates,
        List<String> approverIds,
        Set<String> excludedKeys
) {

    public BatchView {
        candidates = List.copyOf(candidates);
        approverIds = List.copyOf(approverIds);
        excludedKeys = Set.copyOf(excludedKeys);
    }

    public boolean isExcluded(final NewsCandidate candidate) {
        return excludedKeys.contains(candidate.linkKey());
    }
}

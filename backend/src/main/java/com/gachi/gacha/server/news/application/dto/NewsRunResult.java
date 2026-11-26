package com.gachi.gacha.server.news.application.dto;

import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import java.util.List;
import org.jspecify.annotations.Nullable;

/**
 * 수집 실행 한 번의 결과. 실행 보고(슬랙)는 이 값으로 만든다.
 */
public sealed interface NewsRunResult {

    String topic();

    String runName();

    /**
     * 회차를 만들지 않았다. 다른 수집이 진행 중일 때다.
     */
    record Skipped(String topic, String runName, String reason) implements NewsRunResult {
    }

    /**
     * 회차를 만들어 끝낸 결과. 수집에 성공했는지는 {@code batch.getStatus()} 로 안다.
     *
     * @param candidates 이 회차의 후보. 이전 회차에서 넘겨받은 후보도 포함한다. 수집에 실패한 회차는 넘겨받은 후보만 있다
     * @param expired    이 수집을 시작하면서 만료한 이전 회차. 없으면 null
     */
    record Finished(NewsBatch batch, List<NewsCandidate> candidates, @Nullable Expired expired)
            implements NewsRunResult {

        public Finished {
            candidates = List.copyOf(candidates);
        }

        public Finished withExpired(@Nullable final Expired newExpired) {
            return new Finished(batch, candidates, newExpired);
        }

        @Override
        public String topic() {
            return batch.getTopic();
        }

        @Override
        public String runName() {
            return batch.getRunName();
        }
    }

    /**
     * 만료된 이전 회차. 그 슬랙 메시지를 "만료됨 · N건은 다음 묶음으로 이월"로 바꿀 때 쓴다.
     *
     * @param carriedCount 새 회차로 넘긴 후보 수
     */
    record Expired(Long batchId, int carriedCount) {
    }
}

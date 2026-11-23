package com.gachi.gacha.server.news.application.dto;

import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import java.util.List;

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
     * @param candidates 이 회차에 저장한 후보. 수집에 실패한 회차는 비어 있다
     */
    record Finished(NewsBatch batch, List<NewsCandidate> candidates, Stats stats) implements NewsRunResult {

        public Finished {
            candidates = List.copyOf(candidates);
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
     * 수집하면서 뺀 소식 수. 보고에서 "왜 이만큼만 올라왔는지" 알 수 있게 한다.
     *
     * @param duplicates   같은 실행 안에서 같은 게시물이라 뺀 수
     * @param discarded    형식 검사에서 버린 수
     * @param skippedPosts Grok 이 굿즈와 무관하다고 뺀 게시물 수
     */
    record Stats(int duplicates, int discarded, int skippedPosts) {

        public static final Stats NONE = new Stats(0, 0, 0);
    }
}

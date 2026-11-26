package com.gachi.gacha.server.news.evaluation;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsCandidateJpaRepository;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * 정답 세트와 dry-run 으로 저장한 회차의 후보를 비교해 평가 결과를 만든다. 환경변수 NEWS_EVAL_BATCH_IDS 가 있을 때만 실행하고,
 * 평소 테스트에서는 건너뛴다. Grok 은 호출하지 않고, 앞서 dry-run 수집이 DB 에 저장한 후보만 읽는다.
 *
 * <pre>
 * # 1. 로컬에서 dry-run 수집을 돌려 회차 번호(로그의 batchId)를 확인한다
 * # 2. 정답 세트를 src/test/resources/news/evaluation/answers.csv 에 둔다 (형식은 answers.example.csv)
 * NEWS_EVAL_BATCH_IDS=12,13 ./gradlew test --tests '*NewsEvaluationRunTest'
 * # 결과: build/reports/news-evaluation.md (로그에도 같은 내용이 남는다)
 * </pre>
 *
 * <p>정답 세트 위치를 바꾸려면 NEWS_EVAL_ANSWERS 에 경로를 준다.
 */
@Slf4j
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "NEWS_EVAL_BATCH_IDS", matches = ".+")
class NewsEvaluationRunTest {

    private static final String DEFAULT_ANSWERS = "src/test/resources/news/evaluation/answers.csv";
    private static final Path REPORT = Path.of("build/reports/news-evaluation.md");

    @Autowired
    private NewsCandidateJpaRepository candidateRepository;

    @Test
    @DisplayName("정답 세트와 저장된 후보를 비교해 마크다운 보고서를 만든다")
    void evaluate() throws IOException {
        Path answersPath = Path.of(System.getenv().getOrDefault("NEWS_EVAL_ANSWERS", DEFAULT_ANSWERS));
        assertThat(answersPath).as("정답 세트 CSV 가 있어야 한다: " + answersPath).exists();
        List<NewsCandidate> candidates = new ArrayList<>();
        Arrays.stream(System.getenv("NEWS_EVAL_BATCH_IDS").split(","))
                .map(String::strip).filter(id -> !id.isEmpty()).map(Long::parseLong)
                .forEach(batchId -> candidates.addAll(candidateRepository.findAllByBatchIdOrderByIdAsc(batchId)));

        NewsEvaluator evaluator = new NewsEvaluator();
        NewsEvaluator.Report report = evaluator.evaluate(
                evaluator.parse(Files.readString(answersPath, StandardCharsets.UTF_8)), candidates);
        String markdown = evaluator.toMarkdown(report);

        Files.createDirectories(REPORT.getParent());
        Files.writeString(REPORT, markdown, StandardCharsets.UTF_8);
        log.info("신상 소식 수집 평가 (후보 {}건)\n{}", candidates.size(), markdown);
        assertThat(candidates).as("NEWS_EVAL_BATCH_IDS 의 회차에 후보가 있어야 한다").isNotEmpty();
    }
}

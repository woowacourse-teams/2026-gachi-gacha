package com.gachi.gacha.server.news.infra;

import com.gachi.gacha.server.news.domain.CollectionPlanner;
import com.gachi.gacha.server.news.domain.NewsPostProcessor;
import java.time.Clock;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.ObjectMapper;

/**
 * 신상 소식 기능의 구성. 기능이 꺼져 있어도(news.enabled=false) 빈은 만들어서 앱이 외부 키 없이 뜬다.
 * 기능을 켰는데 필수 설정이 비어 있으면 앱이 뜰 때 바로 실패한다.
 */
@Slf4j
@Configuration
public class NewsConfig {

    public static final String EXECUTOR_NAME = "newsExecutor";
    private static final String SLACK_API_URL = "https://slack.com/api";

    /**
     * 수집은 Grok 을 여러 번 불러 몇 분이 걸린다. 스케줄러 스레드(기본 1개)를 붙잡아 다른 스케줄을 막지 않도록
     * 수집은 이 실행기에서 돈다. 서버 1대에서 수집이 겹칠 일이 드물어 스레드는 1개다.
     */
    private static final int EXECUTOR_THREADS = 1;
    private static final int EXECUTOR_QUEUE = 10;
    private static final int AWAIT_TERMINATION_SECONDS = 30;

    public NewsConfig(final NewsProperties properties) {
        List<String> missing = properties.missingRequiredSettings();
        if (!missing.isEmpty()) {
            throw new IllegalStateException("news.enabled=true 인데 필수 설정이 비어 있다: " + missing);
        }
    }

    @Bean
    @ConditionalOnMissingBean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }

    @Bean(name = EXECUTOR_NAME)
    public ThreadPoolTaskExecutor newsExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(EXECUTOR_THREADS);
        executor.setMaxPoolSize(EXECUTOR_THREADS);
        executor.setQueueCapacity(EXECUTOR_QUEUE);
        executor.setThreadNamePrefix("news-");
        executor.setRejectedExecutionHandler((task, pool) ->
                log.error("신상 소식 작업 대기열이 가득 차 작업을 버립니다. queueSize = {}", pool.getQueue().size()));
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(AWAIT_TERMINATION_SECONDS);
        return executor;
    }

    @Bean
    public RetryBackoff retryBackoff() {
        return new RetryBackoff();
    }

    /**
     * 공용 RestTemplate(응답 5초)으로는 Grok 응답(최대 몇 분)을 기다릴 수 없어 타임아웃을 따로 둔다.
     */
    @Bean
    public XaiGrokClient xaiGrokClient(final NewsProperties properties, final ObjectMapper objectMapper) {
        NewsProperties.Xai xai = properties.xai();
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(xai.connectTimeout());
        requestFactory.setReadTimeout(xai.readTimeout());
        return new XaiGrokClient(new RestTemplate(requestFactory), objectMapper, xai.baseUrl(), xai.model(), xai.apiKey());
    }

    /**
     * 슬랙 호출은 짧으므로 공용 RestTemplate(연결 3초, 응답 5초)을 그대로 쓴다.
     */
    @Bean
    public SlackClient slackClient(
            final RestTemplate restTemplate,
            final ObjectMapper objectMapper,
            final NewsProperties properties,
            final RetryBackoff backoff
    ) {
        return new SlackClient(restTemplate, objectMapper, SLACK_API_URL, properties.slack().botToken(), backoff);
    }

    @Bean
    public SlackSignatureVerifier slackSignatureVerifier(final NewsProperties properties) {
        return new SlackSignatureVerifier(properties.slack().signingSecret());
    }

    @Bean
    public GrokResponseParser grokResponseParser(final ObjectMapper objectMapper) {
        return new GrokResponseParser(objectMapper);
    }

    @Bean
    public NewsPromptRenderer newsPromptRenderer() {
        return new NewsPromptRenderer();
    }

    @Bean
    public NewsPostProcessor newsPostProcessor() {
        return new NewsPostProcessor();
    }

    @Bean
    public CollectionPlanner collectionPlanner(final NewsProperties properties) {
        return new CollectionPlanner(properties.collect().defaultPeriodDays(), properties.collect().maxPeriodDays());
    }
}

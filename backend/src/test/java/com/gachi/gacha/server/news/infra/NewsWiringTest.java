package com.gachi.gacha.server.news.infra;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.gachi.gacha.server.news.application.NewsBatchService;
import com.gachi.gacha.server.news.application.NewsCollectService;
import com.gachi.gacha.server.news.application.NewsInteractionService;
import com.gachi.gacha.server.news.application.NewsScheduler;
import com.gachi.gacha.server.news.application.NewsSlackMessageBuilder;
import com.gachi.gacha.server.news.domain.NewsBatchJpaRepository;
import com.gachi.gacha.server.news.domain.NewsCandidateJpaRepository;
import com.gachi.gacha.server.news.presentation.SlackInteractionController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

/**
 * DB 없이 신상 소식 빈이 서로 연결되는지, 기능을 껐을 때 스케줄러가 빠지고 켰는데 필수 설정이 비면 앱이 뜨지 않는지 확인한다.
 */
class NewsWiringTest {

    private static final String[] TOPIC = {
            "news.topics.CHIIKAWA.display-name=치이카와",
            "news.topics.CHIIKAWA.prompt-dir=news/prompts/chiikawa",
            "news.topics.CHIIKAWA.prompt-version=chiikawa-v2",
            "news.topics.CHIIKAWA.targets[0].label=KR_shop",
            "news.topics.CHIIKAWA.targets[0].handle=chiikawashop_kr",
            "news.topics.CHIIKAWA.targets[0].chunk-days=2",
            "news.topics.CHIIKAWA.runs.THURSDAY[0]=KR_shop"
    };

    private final ApplicationContextRunner runner = new ApplicationContextRunner().withUserConfiguration(Beans.class);

    @Test
    @DisplayName("기능이 꺼져 있으면 외부 키 없이도 빈이 만들어지고, 수집 스케줄러는 만들어지지 않는다")
    void disabledStartsWithoutSchedulerOrSecrets() {
        runner.withPropertyValues(TOPIC).run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).hasSingleBean(NewsCollectService.class).hasSingleBean(NewsSlackMessageBuilder.class)
                    .hasSingleBean(NewsBatchService.class);
            assertThat(context).doesNotHaveBean(NewsScheduler.class).doesNotHaveBean(NewsInteractionService.class)
                    .doesNotHaveBean(SlackInteractionController.class);
        });
    }

    @Test
    @DisplayName("기능을 켜고 필수 설정을 채우면 스케줄러까지 만들어진다")
    void enabledCreatesScheduler() {
        runner.withPropertyValues(TOPIC).withPropertyValues("news.enabled=true", "news.xai.api-key=k",
                "news.slack.bot-token=t", "news.slack.channel-id=C1").run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).hasSingleBean(NewsScheduler.class).hasSingleBean(NewsInteractionService.class)
                    .hasSingleBean(SlackInteractionController.class);
        });
    }

    @Test
    @DisplayName("기능을 켰는데 필수 설정이 비어 있으면 앱이 뜨지 않고 무엇이 빠졌는지 알려준다")
    void enabledWithoutSecretsFails() {
        runner.withPropertyValues(TOPIC).withPropertyValues("news.enabled=true", "news.dry-run=false").run(context -> {
            assertThat(context).hasFailed();
            assertThat(context.getStartupFailure()).rootCause().hasMessageContaining("XAI_API_KEY")
                    .hasMessageContaining("SLACK_BOT_TOKEN").hasMessageContaining("SLACK_NEWS_CHANNEL_ID");
        });
    }

    @Configuration
    @EnableConfigurationProperties(NewsProperties.class)
    @Import({NewsConfig.class, NewsBatchService.class, NewsCollectService.class, NewsSlackMessageBuilder.class,
            NewsScheduler.class, NewsInteractionService.class, SlackInteractionController.class})
    static class Beans {

        @Bean
        RestTemplate restTemplate() {
            return new RestTemplate();
        }

        @Bean
        ObjectMapper objectMapper() {
            return JsonMapper.builder().build();
        }

        @Bean
        NewsBatchJpaRepository batchRepository() {
            return mock(NewsBatchJpaRepository.class);
        }

        @Bean
        NewsCandidateJpaRepository candidateRepository() {
            return mock(NewsCandidateJpaRepository.class);
        }
    }
}

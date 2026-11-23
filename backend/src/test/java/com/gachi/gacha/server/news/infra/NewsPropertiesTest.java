package com.gachi.gacha.server.news.infra;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gachi.gacha.server.news.domain.CollectTarget;
import java.io.IOException;
import java.time.Duration;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.BindException;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.bind.PropertySourcesPlaceholdersResolver;
import org.springframework.boot.context.properties.source.ConfigurationPropertySources;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.FileSystemResource;

/**
 * 실제 application.yaml 의 news 설정이 의도대로 묶이는지 확인한다. 환경변수 대신 값을 직접 넣어 묶는다.
 */
class NewsPropertiesTest {

    private List<PropertySource<?>> yaml;

    @BeforeEach
    void setUp() throws IOException {
        yaml = new YamlPropertySourceLoader().load("application", new FileSystemResource("src/main/resources/application.yaml"));
    }

    @Test
    @DisplayName("환경변수가 없으면 기능은 꺼져 있고 dry-run 은 켜져 있으며, 비밀값은 비어 있고 상한은 요구사항과 같다")
    void defaults() {
        NewsProperties properties = bind(Map.of());

        assertThat(properties.enabled()).isFalse();
        assertThat(properties.dryRun()).isTrue();
        assertThat(properties.environmentLabel()).isEmpty();
        assertThat(properties.zone()).isEqualTo(ZoneId.of("Asia/Seoul"));
        assertThat(properties.xai().apiKey()).isEmpty();
        assertThat(properties.slack().botToken()).isEmpty();
        assertThat(properties.missingRequiredSettings()).isEmpty();
        assertThat(properties.collect()).isEqualTo(new NewsProperties.Collect(7, 14, 40, 0.6, Duration.ofHours(6)));
        assertThat(properties.xai().connectTimeout()).isEqualTo(Duration.ofSeconds(10));
        assertThat(properties.xai().readTimeout()).isEqualTo(Duration.ofSeconds(300));
    }

    @Test
    @DisplayName("치이카와 대상은 스크립트와 같고, 월요일은 한국 계정만·목요일은 한국·일본 계정을 설정 순서대로 고른다")
    void chiikawaTargetsAndRuns() {
        NewsProperties.Topic chiikawa = bind(Map.of()).topic("CHIIKAWA").orElseThrow();

        assertThat(chiikawa.displayName()).isEqualTo("치이카와");
        assertThat(chiikawa.promptVersion()).isEqualTo("chiikawa-v2");
        assertThat(chiikawa.storeHours()).isEqualTo("10:30 ~ 22:00");
        assertThat(chiikawa.targets()).containsExactly(
                new CollectTarget("KR_shop", "chiikawashop_kr", 2, true, ""),
                new CollectTarget("KR_market", "chiikawa_m_kr", 2, true, ""),
                new CollectTarget("JP_market", "chiikawa_market", 1, false, "-filter:replies -filter:retweets"),
                new CollectTarget("JP_kouhou", "chiikawa_kouhou", 7, false, "-filter:replies -filter:retweets"));
        assertThat(chiikawa.targetsOf("MONDAY")).extracting(CollectTarget::handle)
                .containsExactly("chiikawashop_kr", "chiikawa_m_kr");
        assertThat(chiikawa.targetsOf("THURSDAY")).extracting(CollectTarget::handle)
                .containsExactly("chiikawashop_kr", "chiikawa_m_kr", "chiikawa_market", "chiikawa_kouhou");
        assertThat(chiikawa.targetsOf("SUNDAY")).isEmpty();
    }

    @Test
    @DisplayName("환경 표시와 dry-run 은 환경변수로 바꾼다")
    void environmentValues() {
        NewsProperties properties = bind(Map.of("NEWS_ENVIRONMENT_LABEL", " [개발] ", "NEWS_DRY_RUN", "false"));

        assertThat(properties.environmentLabel()).isEqualTo("[개발]");
        assertThat(properties.dryRun()).isFalse();
    }

    @Test
    @DisplayName("기능을 켰는데 필수 값이 비어 있으면 무엇이 빠졌는지 알려준다")
    void reportsMissingRequiredSettings() {
        assertThat(bind(Map.of("NEWS_ENABLED", "true", "NEWS_DRY_RUN", "false", "SLACK_BOT_TOKEN", "xoxb-test"))
                .missingRequiredSettings()).containsExactly("XAI_API_KEY", "SLACK_NEWS_CHANNEL_ID");
        assertThat(bind(Map.of("NEWS_ENABLED", "true", "NEWS_DRY_RUN", "false")).missingRequiredSettings())
                .containsExactly("XAI_API_KEY", "SLACK_BOT_TOKEN", "SLACK_NEWS_CHANNEL_ID");
        assertThat(bind(Map.of("NEWS_ENABLED", "true", "XAI_API_KEY", "x", "SLACK_BOT_TOKEN", "x",
                "SLACK_NEWS_CHANNEL_ID", "C1")).missingRequiredSettings()).isEmpty();
    }

    @Test
    @DisplayName("dry-run 에서는 슬랙 값을 비워 둘 수 있지만, 봇 토큰을 넣었다면 채널도 있어야 한다")
    void slackIsOptionalInDryRun() {
        assertThat(bind(Map.of("NEWS_ENABLED", "true", "XAI_API_KEY", "x")).missingRequiredSettings()).isEmpty();
        assertThat(bind(Map.of("NEWS_ENABLED", "true", "XAI_API_KEY", "x", "SLACK_BOT_TOKEN", "xoxb-test"))
                .missingRequiredSettings()).containsExactly("SLACK_NEWS_CHANNEL_ID");
    }

    @Test
    @DisplayName("일정에 없는 대상 라벨, 겹치는 대상 라벨은 앱이 뜨지 않게 막는다")
    void rejectsInvalidSettings() {
        assertThatThrownBy(() -> bind(Map.of("news.topics.CHIIKAWA.runs.MONDAY[0]", "KR_unknown")))
                .isInstanceOf(BindException.class).rootCause().hasMessageContaining("없는 대상 라벨: KR_unknown");
        assertThatThrownBy(() -> bind(Map.of(
                "news.topics.CHIIKAWA.targets[0].label", "KR_shop", "news.topics.CHIIKAWA.targets[0].handle", "a",
                "news.topics.CHIIKAWA.targets[0].chunk-days", "1",
                "news.topics.CHIIKAWA.targets[1].label", "KR_shop", "news.topics.CHIIKAWA.targets[1].handle", "b",
                "news.topics.CHIIKAWA.targets[1].chunk-days", "1")))
                .isInstanceOf(BindException.class).rootCause().hasMessageContaining("대상 라벨이 겹친다: KR_shop");
    }

    /**
     * 목록 설정은 우선순위가 가장 높은 곳의 값으로 통째로 묶인다.
     */
    private NewsProperties bind(final Map<String, Object> overrides) {
        List<PropertySource<?>> sources = new ArrayList<>();
        sources.add(new MapPropertySource("overrides", overrides));
        sources.addAll(yaml);
        Binder binder = new Binder(ConfigurationPropertySources.from(sources), new PropertySourcesPlaceholdersResolver(sources));
        return binder.bindOrCreate("news", Bindable.of(NewsProperties.class));
    }
}

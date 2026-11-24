package com.gachi.gacha.server.news.infra;

import com.gachi.gacha.server.news.domain.CollectTarget;
import java.time.Duration;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.jspecify.annotations.Nullable;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * 신상 소식 설정. 비밀값은 환경변수로만 받는다. 수집 cron 은 스케줄러가 news.schedule.* 를 직접 읽는다.
 *
 * @param enabled          기능 전체 켜기. 꺼져 있으면 수집하지 않는다
 * @param dryRun           켜져 있으면 수집·검증·저장까지만 하고 공개와 푸시를 하지 않는다
 * @param environmentLabel 슬랙 메시지 맨 앞 표시 (예: [개발]). 운영은 빈 값이다
 * @param zone             진행 상태 판단에 쓰는 시간대
 * @param hideEndedAfterDays 끝난 소식을 목록에서 숨기기까지의 일수. 종료일이 없으면 시작일(없으면 공개일) 기준이다
 * @param topics           주제(IP)별 설정. 키가 주제 값이다 (예: CHIIKAWA)
 */
@ConfigurationProperties("news")
public record NewsProperties(
        @DefaultValue("false") boolean enabled,
        @DefaultValue("true") boolean dryRun,
        @Nullable String environmentLabel,
        @DefaultValue("Asia/Seoul") ZoneId zone,
        @DefaultValue("30") int hideEndedAfterDays,
        @DefaultValue Collect collect,
        @DefaultValue Xai xai,
        @DefaultValue Slack slack,
        @DefaultValue Map<String, Topic> topics
) {

    public NewsProperties {
        environmentLabel = environmentLabel == null ? "" : environmentLabel.strip();
        topics = topics == null ? Map.of() : Map.copyOf(topics);
        topics.forEach(Topic::validate);
    }

    public Optional<Topic> topic(final String topic) {
        return Optional.ofNullable(topics.get(topic));
    }

    /**
     * 기능을 켰는데 비어 있는 필수 값. 앱이 뜰 때 확인해서 빠진 값을 바로 알 수 있게 한다.
     * 슬랙 값은 dry-run 일 때 비워 둘 수 있다(로컬에서 슬랙 없이 수집만 확인). 봇 토큰을 넣었다면 채널도 있어야 한다.
     * 버튼을 받는 서명 시크릿과 승인자는 dry-run 이 아닐 때(승인 요청에 버튼이 달릴 때)만 필요하다.
     */
    public List<String> missingRequiredSettings() {
        List<String> missing = new ArrayList<>();
        if (!enabled) {
            return missing;
        }
        addIfBlank(missing, xai.apiKey(), "XAI_API_KEY");
        if (!dryRun || (slack.botToken() != null && !slack.botToken().isBlank())) {
            addIfBlank(missing, slack.botToken(), "SLACK_BOT_TOKEN");
            addIfBlank(missing, slack.channelId(), "SLACK_NEWS_CHANNEL_ID");
        }
        if (!dryRun) {
            addIfBlank(missing, slack.signingSecret(), "SLACK_SIGNING_SECRET");
            if (slack.approvers().isEmpty()) {
                missing.add("SLACK_NEWS_APPROVERS");
            }
        }
        if (topics.isEmpty()) {
            missing.add("news.topics");
        }
        return missing;
    }

    private static void addIfBlank(final List<String> missing, @Nullable final String value, final String name) {
        if (value == null || value.isBlank()) {
            missing.add(name);
        }
    }

    /**
     * @param defaultPeriodDays 처음 수집할 때(계정의 수집 기록이 없을 때) 기간
     * @param maxPeriodDays     수집 기간 상한. 실패가 이어져 기간이 길어져도 이 일수까지만 본다
     * @param maxCallsPerRun    실행 1회당 Grok 호출 상한. 재시도도 센다
     * @param maxCostUsd        실행 1회당 비용 상한(달러). 넘으면 남은 호출을 하지 않는다
     * @param stuckAfter        수집 중으로 이 시간 넘게 남은 회차는 서버가 멈춘 것으로 보고 실패 처리한다
     */
    public record Collect(
            @DefaultValue("7") int defaultPeriodDays,
            @DefaultValue("14") int maxPeriodDays,
            @DefaultValue("40") int maxCallsPerRun,
            @DefaultValue("0.6") double maxCostUsd,
            @DefaultValue("6h") Duration stuckAfter
    ) {
    }

    public record Xai(
            @DefaultValue("https://api.x.ai/v1") String baseUrl,
            @Nullable String apiKey,
            @DefaultValue("grok-4.3") String model,
            @DefaultValue("10s") Duration connectTimeout,
            @DefaultValue("300s") Duration readTimeout,
            @DefaultValue("2") int maxTurns,
            @DefaultValue("3") int maxTurnsWithWebSearch
    ) {
    }

    /**
     * @param signingSecret 버튼 요청의 서명을 검증하는 비밀값
     * @param approvers     승인할 수 있는 사람. {@code 슬랙회원ID:가치가챠회원ID} 를 쉼표로 이어서 환경변수에 넣는다
     */
    public record Slack(
            @Nullable String botToken,
            @Nullable String channelId,
            @Nullable String signingSecret,
            @DefaultValue List<String> approvers
    ) {

        public Slack {
            approvers = approvers == null ? List.of() : approvers.stream()
                    .map(String::strip)
                    .filter(approver -> !approver.isEmpty())
                    .toList();
            approvers.forEach(Slack::parseMemberId);
        }

        public boolean isApprover(@Nullable final String slackUserId) {
            return approverMemberId(slackUserId).isPresent();
        }

        /**
         * 승인자의 가치가챠 회원 ID. [나에게 테스트 발송]을 그 사람의 기기로 보낼 때 쓴다.
         */
        public Optional<Long> approverMemberId(@Nullable final String slackUserId) {
            if (slackUserId == null) {
                return Optional.empty();
            }
            return approvers.stream()
                    .filter(approver -> approver.substring(0, approver.indexOf(':')).equals(slackUserId))
                    .map(Slack::parseMemberId)
                    .findFirst();
        }

        private static long parseMemberId(final String approver) {
            int separator = approver.indexOf(':');
            if (separator <= 0 || separator == approver.length() - 1) {
                throw new IllegalStateException("news.slack.approvers 는 '슬랙회원ID:가치가챠회원ID' 형식이어야 한다: " + approver);
            }
            try {
                return Long.parseLong(approver.substring(separator + 1));
            } catch (NumberFormatException e) {
                throw new IllegalStateException("news.slack.approvers 의 가치가챠 회원 ID 가 숫자가 아니다: " + approver, e);
            }
        }
    }

    /**
     * 주제(IP) 하나의 설정. IP 를 추가할 때는 이 설정과 프롬프트 파일만 늘린다.
     *
     * @param displayName   사용자에게 보이는 이름 (예: 치이카와)
     * @param nameJa        일본어 이름. 프롬프트에 쓴다
     * @param promptDir     클래스패스 안의 프롬프트 폴더. system.txt 와 user.txt 가 있어야 한다
     * @param promptVersion 프롬프트 버전명. 회차에 기록해 결과가 어느 프롬프트로 나왔는지 알 수 있게 한다
     * @param storeHours    매장 평소 운영시간. 같은 운영시간을 반복한 공지를 지울 때 쓴다. 없으면 지우지 않는다
     * @param runs          수집 일정 이름(MONDAY, THURSDAY)별로 수집할 대상 라벨
     */
    public record Topic(
            String displayName,
            @Nullable String nameJa,
            String promptDir,
            String promptVersion,
            @Nullable String storeHours,
            @DefaultValue List<CollectTarget> targets,
            @DefaultValue Map<String, List<String>> runs
    ) {

        static void validate(final String topic, final Topic config) {
            Set<String> labels = new HashSet<>();
            for (CollectTarget target : config.targets()) {
                if (!labels.add(target.label())) {
                    throw new IllegalStateException("news.topics." + topic + " 의 대상 라벨이 겹친다: " + target.label());
                }
            }
            config.runs().forEach((run, runLabels) -> runLabels.stream()
                    .filter(label -> !labels.contains(label))
                    .findFirst()
                    .ifPresent(label -> {
                        throw new IllegalStateException(
                                "news.topics." + topic + ".runs." + run + " 에 없는 대상 라벨: " + label);
                    }));
        }

        /**
         * 일정에 고른 대상을 설정에 적은 순서대로 돌려준다. 그 일정이 없는 주제면 비어 있다.
         */
        public List<CollectTarget> targetsOf(final String runName) {
            List<String> runLabels = runs.getOrDefault(runName, List.of());
            return targets.stream().filter(target -> runLabels.contains(target.label())).toList();
        }
    }
}

package com.gachi.gacha.server.news.application;

import com.gachi.gacha.server.news.application.dto.BatchView;
import com.gachi.gacha.server.news.domain.NewsBatchStatus;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsItem;
import com.gachi.gacha.server.news.domain.NewsItemJpaRepository;
import com.gachi.gacha.server.news.domain.NewsMemberTopicJpaRepository;
import com.gachi.gacha.server.news.domain.NewsPushCopy;
import com.gachi.gacha.server.news.domain.NewsSendPolicy;
import com.gachi.gacha.server.news.infra.NewsProperties;
import com.gachi.gacha.server.notification.application.PushMessage;
import com.gachi.gacha.server.notification.application.PushResult;
import com.gachi.gacha.server.notification.application.PushSender;
import com.gachi.gacha.server.notification.application.PushTokenService;
import com.gachi.gacha.server.notification.domain.PushToken;
import com.gachi.gacha.server.notification.domain.PushTokenJpaRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.stereotype.Service;

/**
 * 승인된 신상 소식의 요약 푸시를 보낸다. 트랜잭션을 걸지 않는다. FCM 호출은 DB 커넥션 없이 하고,
 * 상태 변화는 {@link NewsApprovalService} 의 짧은 트랜잭션에서 한다.
 *
 * <p>보장 수준은 최대 한 번이다. 호출하기 <b>전에</b> 발송 중으로 표시하고, 호출 결과가 어떻든 다시 보내지 않는다.
 * 발송 경로는 {@link #sendDue()} 하나다(1분마다 스케줄러가 부른다). 승인 직후에 바로 보내는 경로는 없다.
 *
 * <p>목록 공개 시각은 발송 예정 시각과 같게 승인할 때 정해 두었다. 발송이 허용 시간 밖으로 밀리면 둘을 함께 미룬다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnBooleanProperty("news.enabled")
public class NewsPushService {

    private static final String TEST_PREFIX = "[테스트] ";
    private static final String DELIVERY_NOTE = "_성공은 FCM 이 요청을 받아들였다는 뜻이며, 기기에 도착했다는 뜻은 아닙니다._";

    private final NewsApprovalService approvalService;
    private final NewsSlackReporter reporter;
    private final NewsItemJpaRepository itemRepository;
    private final NewsMemberTopicJpaRepository memberTopicRepository;
    private final PushTokenJpaRepository pushTokenRepository;
    private final PushTokenService pushTokenService;
    private final PushSender pushSender;
    private final NewsSendPolicy sendPolicy;
    private final NewsProperties properties;
    private final Clock clock;

    /**
     * 발송 시각이 지난 승인된 회차를 보낸다. 허용 시간 밖이면 보내지 않고 다음 발송 가능 시각으로 미룬다.
     * 발송 중으로 오래 남은 회차가 있으면 다시 보내지 않고 슬랙으로 경고한다.
     */
    public void sendDue() {
        LocalDateTime now = LocalDateTime.now(clock);
        warnStuckSending(now);
        List<Long> due = approvalService.findDueForSending(now);
        if (due.isEmpty()) {
            return;
        }
        boolean allowed = sendPolicy.isWithinWindow(clock.instant());
        for (Long batchId : due) {
            try {
                if (allowed) {
                    send(batchId);
                } else {
                    approvalService.postpone(batchId);
                }
            } catch (RuntimeException e) {
                log.error("신상 소식 발송 처리 중 예외. batchId = {}", batchId, e);
            }
        }
    }

    private void send(final Long batchId) {
        if (!approvalService.claimForSending(batchId, LocalDateTime.now(clock))) {
            return;
        }
        Outcome outcome;
        try {
            outcome = push(batchId);
        } catch (RuntimeException e) {
            // 호출 도중에 예외가 났으면 받아들여졌는지 알 수 없다. 두 번 가는 것보다 한 번 빠지는 게 낫다
            log.error("신상 소식 발송 중 예외. 다시 보내지 않는다. batchId = {}", batchId, e);
            outcome = new Outcome(false, "발송 상태 확인 필요 · 발송 중 오류가 나 결과를 알 수 없습니다 (재발송 안 함): " + e.getClass().getSimpleName());
        }
        approvalService.finishSending(batchId, outcome.succeeded());
        reporter.refresh(batchId);
        reporter.replyInThread(batchId, outcome.text());
    }

    private Outcome push(final Long batchId) {
        BatchView view = approvalService.view(batchId).orElseThrow(() -> new IllegalStateException("없는 회차: " + batchId));
        String topic = view.batch().getTopic();
        LocalDate todayKst = todayKst();
        List<NewsCandidate> leads = itemRepository.findAllByBatchId(batchId).stream()
                .map(NewsItem::getCandidate)
                .filter(NewsCandidate::isPushTarget)
                .filter(candidate -> !candidate.isEndedOn(todayKst))
                .toList();
        if (leads.isEmpty()) {
            return new Outcome(true, "보낼 푸시 대상이 없어(행사가 모두 끝남) 푸시를 보내지 않았습니다.");
        }
        List<Long> subscribers = memberTopicRepository.findSubscribedMemberIds(topic);
        List<String> tokens = subscribers.isEmpty() ? List.of() : tokensOf(pushTokenRepository.findAllByMemberIdIn(subscribers));
        PushMessage message = message(topic, NewsPushCopy.body(leads, todayKst), false);
        PushResult result = deliver(tokens, message);
        return new Outcome(result.unknownCount() == 0, resultText(subscribers.size(), tokens.size(), result, message));
    }

    /**
     * [나에게 테스트 발송]. 실제로 보낼 요약 푸시와 같은 내용을 누른 사람의 가치가챠 회원 기기로만 보낸다.
     * 회차의 상태를 바꾸지 않고, 발송 허용 시간과 상한을 받지 않는다. 결과는 스레드 답글로 남긴다.
     */
    public TestSend sendTest(final Long batchId, final Long memberId, final String slackUserId) {
        Optional<BatchView> found = approvalService.view(batchId);
        if (found.isEmpty()) {
            return TestSend.NOT_FOUND;
        }
        BatchView view = found.get();
        if (view.batch().getStatus() != NewsBatchStatus.AWAITING_APPROVAL || view.batch().isDryRun()) {
            return TestSend.CLOSED;
        }
        LocalDate todayKst = todayKst();
        List<NewsCandidate> leads = view.candidates().stream()
                .filter(NewsCandidate::isPushTarget)
                .filter(candidate -> !view.isExcluded(candidate))
                .filter(candidate -> !candidate.isEndedOn(todayKst))
                .toList();
        String requester = NewsSlackMessageBuilder.mention(slackUserId);
        if (leads.isEmpty()) {
            reporter.replyInThread(batchId, "테스트 발송 · " + requester + " · 보낼 푸시 대상이 없어 보내지 않았습니다.");
            return TestSend.DONE;
        }
        PushMessage message = message(view.batch().getTopic(), NewsPushCopy.body(leads, todayKst), true);
        try {
            List<String> tokens = tokensOf(pushTokenRepository.findAllByMemberId(memberId));
            PushResult result = deliver(tokens, message);
            reporter.replyInThread(batchId, "테스트 발송 · " + requester + " · " + testResultText(tokens.size(), result, message));
        } catch (RuntimeException e) {
            log.error("신상 소식 테스트 발송 실패. batchId = {}", batchId, e);
            reporter.replyInThread(batchId, "테스트 발송 실패 · " + requester + " · " + e.getClass().getSimpleName());
        }
        return TestSend.DONE;
    }

    /**
     * 토큰이 없으면 호출하지 않는다. 무효 토큰은 발송이 끝난 뒤 정리한다.
     */
    private PushResult deliver(final List<String> tokens, final PushMessage message) {
        if (tokens.isEmpty()) {
            return PushResult.NONE;
        }
        PushResult result = pushSender.sendWithResult(tokens, message);
        if (!result.invalidTokens().isEmpty()) {
            pushTokenService.deleteInvalidTokens(result.invalidTokens());
        }
        return result;
    }

    private void warnStuckSending(final LocalDateTime now) {
        NewsProperties.Send send = properties.send();
        for (Long batchId : approvalService.findStuckSending(now.minus(send.stuckAfter()))) {
            approvalService.failStuckSending(batchId).ifPresent(batch -> {
                log.warn("발송 중으로 오래 남은 회차를 정리한다. 다시 보내지 않는다. batchId = {}", batchId);
                reporter.refresh(batchId);
                reporter.replyInThread(batchId, "⚠️ 발송 상태 확인 필요 (재발송 안 함) · 발송 중으로 표시된 뒤 " + send.stuckAfter().toMinutes()
                        + "분이 지나도 결과를 기록하지 못했습니다. 서버가 발송 중에 멈췄을 수 있어서 푸시가 나갔는지 기기나 FCM 에서 확인해 주세요.");
            });
        }
    }

    private PushMessage message(final String topic, final String body, final boolean test) {
        String title = properties.topic(topic).map(NewsProperties.Topic::displayName).orElse(topic) + " 신상 소식";
        return PushMessage.ofNews(topic, test ? TEST_PREFIX + title : title, body, test);
    }

    private List<String> tokensOf(final List<PushToken> pushTokens) {
        return pushTokens.stream().map(PushToken::getToken).distinct().toList();
    }

    private LocalDate todayKst() {
        return LocalDate.now(clock.withZone(properties.zone()));
    }

    /**
     * 발송 결과 문구. 푸시가 비활성인 환경은 모든 수가 0이라 "실제로 보내지 않음"으로 알린다.
     */
    static String resultText(final int subscribers, final int devices, final PushResult result, final PushMessage message) {
        String head;
        if (devices == 0) {
            head = "발송 완료 · 구독자 " + subscribers + "명 · 기기 0대 (받을 기기가 없어 보내지 않음)";
        } else if (isNotSent(result)) {
            head = "푸시가 비활성(firebase.push-enabled=false)이라 실제로 보내지 않았습니다 · 구독자 " + subscribers + "명 · 기기 " + devices + "대";
        } else if (result.unknownCount() > 0) {
            head = "발송 상태 확인 필요 (재발송 안 함) · 구독자 " + subscribers + "명 · 기기 " + devices + "대 중 성공 " + result.successCount()
                    + " / 실패 " + result.failureCount() + " / 받아들여졌는지 알 수 없음 " + result.unknownCount()
                    + " · 무효 토큰 " + result.invalidTokens().size() + "개 정리";
        } else {
            head = "발송 완료 · 구독자 " + subscribers + "명 · 기기 " + devices + "대 중 성공 " + result.successCount()
                    + " / 실패 " + result.failureCount() + " · 무효 토큰 " + result.invalidTokens().size() + "개 정리";
        }
        return NewsSlackMessageBuilder.escape(head) + "\n" + content(message) + "\n" + DELIVERY_NOTE;
    }

    static String testResultText(final int devices, final PushResult result, final PushMessage message) {
        String head;
        if (devices == 0) {
            head = "내 계정에 등록된 기기가 없어 보내지 않았습니다 (앱에서 로그인하고 알림을 허용해야 합니다)";
        } else if (isNotSent(result)) {
            head = "푸시가 비활성(firebase.push-enabled=false)이라 실제로 보내지 않았습니다 · 기기 " + devices + "대";
        } else {
            head = "기기 " + devices + "대 중 성공 " + result.successCount() + " / 실패 " + result.failureCount()
                    + (result.unknownCount() > 0 ? " / 받아들여졌는지 알 수 없음 " + result.unknownCount() : "")
                    + " · 무효 토큰 " + result.invalidTokens().size() + "개 정리";
        }
        return NewsSlackMessageBuilder.escape(head) + "\n" + content(message) + "\n" + DELIVERY_NOTE;
    }

    private static boolean isNotSent(final PushResult result) {
        return result.successCount() + result.failureCount() + result.unknownCount() == 0;
    }

    private static String content(final PushMessage message) {
        return "내용: " + NewsSlackMessageBuilder.escape(message.title()) + " / " + NewsSlackMessageBuilder.escape(message.body());
    }

    public enum TestSend {
        DONE,
        /** 승인 대기 상태가 아니다 */
        CLOSED,
        NOT_FOUND
    }

    private record Outcome(boolean succeeded, String text) {
    }
}

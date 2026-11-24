package com.gachi.gacha.server.news.application;

import com.gachi.gacha.server.news.application.dto.BatchView;
import com.gachi.gacha.server.news.application.dto.NewsRunResult;
import com.gachi.gacha.server.news.infra.NewsProperties;
import com.gachi.gacha.server.news.infra.SlackClient;
import com.gachi.gacha.server.news.infra.SlackClient.SlackMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.stereotype.Component;

/**
 * 회차의 상태를 슬랙에 보여준다. 수집 결과는 새 메시지로 보내고(chat.postMessage, 실패하면 재시도),
 * 상태가 바뀔 때마다 같은 메시지를 다시 그린다(chat.update, 재시도하지 않고 로그만 남긴다).
 * 슬랙이 실패해도 DB의 회차 상태는 이미 정해졌으므로 예외를 밖으로 던지지 않는다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnBooleanProperty("news.enabled")
public class NewsSlackReporter {

    private final SlackClient slackClient;
    private final NewsSlackMessageBuilder messageBuilder;
    private final NewsBatchService batchService;
    private final NewsApprovalService approvalService;
    private final NewsProperties properties;

    /**
     * 수집 결과(승인 요청 또는 실행 보고)를 새 메시지로 보내고, 받은 메시지 ts 를 회차에 기록한다.
     * 이 수집이 이전 승인 대기 회차를 만료시켰다면 그 메시지는 "만료됨"으로 바꾼다.
     */
    public void postReport(final NewsRunResult result) {
        try {
            String channel = properties.slack().channelId() == null ? "" : properties.slack().channelId();
            switch (result) {
                case NewsRunResult.Skipped skipped -> slackClient.postMessage(channel, messageBuilder.skipped(skipped));
                case NewsRunResult.Finished finished -> {
                    String messageTs = slackClient.postMessage(channel, messageBuilder.build(finished));
                    if (messageTs != null) {
                        batchService.recordSlackMessage(finished.batch().getId(), channel, messageTs);
                    }
                }
            }
        } catch (RuntimeException e) {
            log.error("신상 소식 실행 보고를 슬랙에 보내지 못했다. topic = {}, run = {} : {}",
                    result.topic(), result.runName(), e.getMessage(), e);
        }
        if (result instanceof NewsRunResult.Finished finished && finished.expired() != null) {
            NewsRunResult.Expired expired = finished.expired();
            approvalService.view(expired.batchId())
                    .ifPresent(view -> update(view, messageBuilder.renderExpired(view, expired.carriedCount())));
        }
    }

    /**
     * 회차의 지금 상태로 그 회차의 슬랙 메시지를 다시 그린다.
     */
    public void refresh(final Long batchId) {
        approvalService.view(batchId).ifPresent(view -> update(view, messageBuilder.render(view)));
    }

    /**
     * 회차의 승인 요청 메시지 스레드에 자세한 결과를 남긴다. 실패해도 던지지 않고 로그만 남긴다.
     */
    public void replyInThread(final Long batchId, final String text) {
        approvalService.view(batchId).ifPresent(view -> {
            String channel = view.batch().getSlackChannelId();
            String messageTs = view.batch().getSlackMessageTs();
            if (channel == null || messageTs == null) {
                log.info("[슬랙 스레드 답글 생략] 메시지를 알린 적 없는 회차. batchId = {}, text = {}", batchId, text);
                return;
            }
            try {
                slackClient.postThreadReply(channel, messageTs, text);
            } catch (RuntimeException e) {
                log.warn("신상 소식 스레드 답글을 남기지 못했다. batchId = {} : {}", batchId, e.getMessage());
            }
        });
    }

    private void update(final BatchView view, final SlackMessage message) {
        String channel = view.batch().getSlackChannelId();
        String messageTs = view.batch().getSlackMessageTs();
        if (channel == null || messageTs == null) {
            return;
        }
        try {
            slackClient.updateMessage(channel, messageTs, message);
        } catch (RuntimeException e) {
            log.warn("신상 소식 슬랙 메시지를 다시 그리지 못했다. batchId = {} : {}", view.batch().getId(), e.getMessage());
        }
    }
}

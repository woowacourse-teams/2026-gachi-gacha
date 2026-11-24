package com.gachi.gacha.server.news.application;

import static com.gachi.gacha.server.news.application.NewsSlackMessageBuilder.ACTION_APPROVE;
import static com.gachi.gacha.server.news.application.NewsSlackMessageBuilder.ACTION_EXCLUDE;
import static com.gachi.gacha.server.news.application.NewsSlackMessageBuilder.ACTION_RECOLLECT;
import static com.gachi.gacha.server.news.application.NewsSlackMessageBuilder.ACTION_TEST_SEND;
import static com.gachi.gacha.server.news.application.NewsSlackMessageBuilder.ACTION_UNDO_EXCLUDE;

import com.gachi.gacha.server.news.application.NewsApprovalService.Result;
import com.gachi.gacha.server.news.application.NewsApprovalService.Vote;
import com.gachi.gacha.server.news.application.dto.SlackInteraction;
import com.gachi.gacha.server.news.infra.NewsProperties;
import com.gachi.gacha.server.news.infra.SlackClient;
import com.gachi.gacha.server.notification.infra.NotificationExecutorConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * 슬랙 버튼 요청을 처리한다. 슬랙은 3초 안에 응답을 받아야 해서, 컨트롤러는 서명만 확인하고 바로 응답하고
 * 실제 처리는 알림 전용 스레드 풀에서 이어서 한다.
 *
 * <p>승인자가 아닌 사람이 누르면 아무것도 바꾸지 않고 그 사람에게만 보이는 안내를 남긴다.
 * 승인자가 누르면 {@link NewsApprovalService} 가 DB 를 바꾸고, 그 트랜잭션이 끝난 뒤 같은 슬랙 메시지를 다시 그린다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnBooleanProperty("news.enabled")
public class NewsInteractionService {

    static final String NOT_APPROVER_MESSAGE = "승인 권한이 없습니다. 승인자로 등록된 사람만 누를 수 있습니다.";
    static final String CLOSED_MESSAGE = "이미 승인되었거나 만료되었거나 다시 수집으로 버려진 묶음이라 바꿀 수 없습니다.";
    static final String NOT_FOUND_MESSAGE = "찾을 수 없는 소식입니다. 이미 다른 묶음으로 넘어갔을 수 있습니다.";
    static final String INVALID_BUTTON_MESSAGE = "버튼 정보가 올바르지 않습니다. 메시지가 오래됐다면 새 승인 요청을 확인해 주세요.";
    static final String TEST_SEND_NOT_READY_MESSAGE = "테스트 발송은 아직 연결되지 않았습니다.";
    static final String RECOLLECT_STARTED_MESSAGE = "다시 수집을 시작합니다. 몇 분 뒤 새 승인 요청이 올라옵니다.";

    private final SlackClient slackClient;
    private final NewsApprovalService approvalService;
    private final NewsSlackReporter reporter;
    private final NewsScheduler scheduler;
    private final NewsProperties properties;

    @Async(NotificationExecutorConfig.EXECUTOR_NAME)
    public void handle(final SlackInteraction interaction) {
        try {
            if (!properties.slack().isApprover(interaction.userId())) {
                log.warn("승인자가 아닌 사람이 신상 소식 버튼을 눌렀다. userId = {}", interaction.userId());
                reply(interaction, NOT_APPROVER_MESSAGE);
                return;
            }
            interaction.actions().forEach(action -> dispatch(interaction, action));
        } catch (RuntimeException e) {
            log.error("신상 소식 버튼 처리에 실패했다. userId = {} : {}", interaction.userId(), e.getMessage(), e);
        }
    }

    private void dispatch(final SlackInteraction interaction, final SlackInteraction.Action action) {
        switch (action.actionId()) {
            case ACTION_EXCLUDE -> changeExclusion(interaction, action, true);
            case ACTION_UNDO_EXCLUDE -> changeExclusion(interaction, action, false);
            case ACTION_APPROVE -> approve(interaction, action);
            case ACTION_RECOLLECT -> recollect(interaction, action);
            case ACTION_TEST_SEND -> reply(interaction, TEST_SEND_NOT_READY_MESSAGE);
            default -> log.warn("알 수 없는 신상 소식 버튼이다. actionId = {}", action.actionId());
        }
    }

    private void changeExclusion(final SlackInteraction interaction, final SlackInteraction.Action action, final boolean exclude) {
        long[] ids = parseIds(action.value(), 2);
        if (ids == null) {
            reply(interaction, INVALID_BUTTON_MESSAGE);
            return;
        }
        Result result = exclude
                ? approvalService.exclude(ids[0], ids[1], interaction.userId())
                : approvalService.undoExclusion(ids[0], ids[1], interaction.userId());
        switch (result) {
            case DONE -> reporter.refresh(ids[0]);
            case NO_CHANGE -> reporter.refresh(ids[0]);
            case NOT_AWAITING -> reply(interaction, CLOSED_MESSAGE);
            case NOT_FOUND -> reply(interaction, NOT_FOUND_MESSAGE);
        }
    }

    private void approve(final SlackInteraction interaction, final SlackInteraction.Action action) {
        long[] ids = parseIds(action.value(), 1);
        if (ids == null) {
            reply(interaction, INVALID_BUTTON_MESSAGE);
            return;
        }
        Vote vote = approvalService.approve(ids[0], interaction.userId());
        int required = properties.requiredApprovals();
        switch (vote.status()) {
            case VOTED -> {
                reply(interaction, "승인했습니다 (" + vote.votes() + "/" + required + "). 서로 다른 " + required + "명이 승인하면 공개됩니다.");
                reporter.refresh(ids[0]);
            }
            case ALREADY_VOTED -> reply(interaction, "이미 승인하셨습니다 (" + vote.votes() + "/" + required + ").");
            case APPROVED -> reporter.refresh(ids[0]);
            case NOT_AWAITING -> reply(interaction, CLOSED_MESSAGE);
            case NOT_FOUND -> reply(interaction, NOT_FOUND_MESSAGE);
        }
    }

    /**
     * 지금 묶음을 버리고, 수집은 신상 소식 전용 실행기에서 이어서 한다(몇 분이 걸린다).
     */
    private void recollect(final SlackInteraction interaction, final SlackInteraction.Action action) {
        long[] ids = parseIds(action.value(), 1);
        if (ids == null) {
            reply(interaction, INVALID_BUTTON_MESSAGE);
            return;
        }
        approvalService.discard(ids[0]).ifPresentOrElse(discarded -> {
            reporter.refresh(ids[0]);
            reply(interaction, RECOLLECT_STARTED_MESSAGE);
            scheduler.recollect(discarded.topic(), discarded.handles());
        }, () -> reply(interaction, CLOSED_MESSAGE));
    }

    /**
     * 버튼 값 "회차ID" 또는 "회차ID:후보ID" 를 읽는다. 형식이 다르면 null.
     */
    private long @Nullable [] parseIds(@Nullable final String value, final int count) {
        if (value == null) {
            return null;
        }
        String[] parts = value.split(":");
        if (parts.length != count) {
            return null;
        }
        try {
            long[] ids = new long[count];
            for (int index = 0; index < count; index++) {
                ids[index] = Long.parseLong(parts[index]);
            }
            return ids;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void reply(final SlackInteraction interaction, final String text) {
        slackClient.postEphemeral(interaction.channelId(), interaction.userId(), text);
    }
}

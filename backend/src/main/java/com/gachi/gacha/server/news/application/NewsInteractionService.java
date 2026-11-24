package com.gachi.gacha.server.news.application;

import com.gachi.gacha.server.news.application.dto.SlackInteraction;
import com.gachi.gacha.server.news.infra.NewsProperties;
import com.gachi.gacha.server.news.infra.SlackClient;
import com.gachi.gacha.server.notification.infra.NotificationExecutorConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * 슬랙 버튼 요청을 처리한다. 슬랙은 3초 안에 응답을 받아야 해서, 컨트롤러는 서명만 확인하고 바로 응답하고
 * 실제 처리는 알림 전용 스레드 풀에서 이어서 한다.
 *
 * <p>승인자가 아닌 사람이 누르면 아무것도 바꾸지 않고 그 사람에게만 보이는 안내를 남긴다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnBooleanProperty("news.enabled")
public class NewsInteractionService {

    static final String NOT_APPROVER_MESSAGE = "승인 권한이 없습니다. 승인자로 등록된 사람만 누를 수 있습니다.";

    private final SlackClient slackClient;
    private final NewsProperties properties;

    @Async(NotificationExecutorConfig.EXECUTOR_NAME)
    public void handle(final SlackInteraction interaction) {
        try {
            if (!properties.slack().isApprover(interaction.userId())) {
                log.warn("승인자가 아닌 사람이 신상 소식 버튼을 눌렀다. userId = {}", interaction.userId());
                reply(interaction, NOT_APPROVER_MESSAGE);
                return;
            }
            // 승인·제외·다시 수집 등 버튼별 처리는 다음 단계에서 연결한다. 그 전까지는 요청이 여기까지 닿았는지만 알려준다.
            String actionIds = String.join(", ", interaction.actions().stream().map(SlackInteraction.Action::actionId).toList());
            reply(interaction, "버튼 요청을 받았습니다 (" + actionIds + "). 버튼별 처리는 아직 연결되지 않았습니다.");
        } catch (RuntimeException e) {
            log.error("신상 소식 버튼 처리에 실패했다. userId = {} : {}", interaction.userId(), e.getMessage(), e);
        }
    }

    private void reply(final SlackInteraction interaction, final String text) {
        slackClient.postEphemeral(interaction.channelId(), interaction.userId(), text);
    }
}

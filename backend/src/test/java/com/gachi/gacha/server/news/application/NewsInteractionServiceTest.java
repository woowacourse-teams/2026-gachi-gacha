package com.gachi.gacha.server.news.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.then;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;

import com.gachi.gacha.server.news.application.dto.SlackInteraction;
import com.gachi.gacha.server.news.domain.NewsFixtures;
import com.gachi.gacha.server.news.infra.SlackClient;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class NewsInteractionServiceTest {

    private final SlackClient slackClient = mock(SlackClient.class);
    private final NewsInteractionService service = new NewsInteractionService(slackClient,
            NewsFixtures.properties(false, "", 40, 0.6));

    @Test
    @DisplayName("승인자가 아닌 사람이 누르면 아무것도 바꾸지 않고, 그 사람에게만 보이는 안내를 남긴다")
    void rejectsNonApprover() {
        service.handle(interaction("U_STRANGER"));

        then(slackClient).should().postEphemeral("C0NEWS", "U_STRANGER", NewsInteractionService.NOT_APPROVER_MESSAGE);
        then(slackClient).shouldHaveNoMoreInteractions();
    }

    @Test
    @DisplayName("승인자가 누르면 요청이 닿았다는 안내를 그 사람에게만 보여준다 (버튼별 처리는 다음 단계)")
    void acknowledgesApprover() {
        service.handle(interaction("U_APPROVER"));

        then(slackClient).should().postEphemeral("C0NEWS", "U_APPROVER",
                "버튼 요청을 받았습니다 (news_approve). 버튼별 처리는 아직 연결되지 않았습니다.");
    }

    @Test
    @DisplayName("슬랙 호출이 실패해도 예외를 밖으로 던지지 않는다")
    void swallowsSlackFailure() {
        willThrow(new SlackClient.SlackException("chat.postEphemeral 실패: channel_not_found"))
                .given(slackClient).postEphemeral(anyString(), anyString(), any());

        service.handle(interaction("U_STRANGER"));

        then(slackClient).should(never()).postMessage(any(), any());
    }

    private SlackInteraction interaction(final String userId) {
        return new SlackInteraction(userId, "tester", "C0NEWS", "1731382200.000100",
                List.of(new SlackInteraction.Action("news_approve", "7")));
    }
}

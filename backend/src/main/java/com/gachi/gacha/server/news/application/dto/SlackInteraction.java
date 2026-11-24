package com.gachi.gacha.server.news.application.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.jspecify.annotations.Nullable;
import tools.jackson.databind.JsonNode;

/**
 * 슬랙 메시지의 버튼을 누른 요청(block_actions)에서 처리에 필요한 값만 꺼낸 것.
 *
 * @param userId    버튼을 누른 슬랙 회원 ID
 * @param userName  버튼을 누른 사람의 슬랙 이름. 승인 진행 표시에 쓴다
 * @param channelId 버튼이 있던 채널
 * @param messageTs 버튼이 있던 메시지
 */
public record SlackInteraction(
        String userId,
        @Nullable String userName,
        String channelId,
        @Nullable String messageTs,
        List<Action> actions
) {

    private static final String BLOCK_ACTIONS = "block_actions";

    public SlackInteraction {
        actions = List.copyOf(actions);
    }

    /**
     * 버튼을 누른 요청만 읽는다. 다른 종류의 요청이나, 누른 사람·채널·버튼이 없는 요청은 비어 있다.
     */
    public static Optional<SlackInteraction> from(final JsonNode payload) {
        if (!BLOCK_ACTIONS.equals(payload.path("type").asString(""))) {
            return Optional.empty();
        }
        String userId = payload.path("user").path("id").asString("");
        String channelId = payload.path("channel").path("id").asString("");
        List<Action> actions = new ArrayList<>();
        for (JsonNode action : payload.path("actions")) {
            String actionId = action.path("action_id").asString("");
            if (!actionId.isEmpty()) {
                actions.add(new Action(actionId, action.path("value").asString(null)));
            }
        }
        if (userId.isEmpty() || channelId.isEmpty() || actions.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(new SlackInteraction(userId, payload.path("user").path("name").asString(null), channelId,
                payload.path("message").path("ts").asString(null), actions));
    }

    public record Action(String actionId, @Nullable String value) {
    }
}

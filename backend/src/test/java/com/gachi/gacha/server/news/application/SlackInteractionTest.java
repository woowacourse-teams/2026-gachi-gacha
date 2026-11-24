package com.gachi.gacha.server.news.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.news.application.dto.SlackInteraction;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class SlackInteractionTest {

    private final JsonMapper mapper = JsonMapper.builder().build();

    @Test
    @DisplayName("버튼을 누른 요청에서 누른 사람, 채널, 메시지, 버튼을 꺼낸다")
    void readsBlockActions() {
        SlackInteraction interaction = SlackInteraction.from(mapper.readTree("""
                {"type": "block_actions", "user": {"id": "U01ABC", "name": "jihyun"},
                 "channel": {"id": "C0NEWS"}, "message": {"ts": "1731382200.000100"},
                 "actions": [{"action_id": "news_exclude", "value": "7:123", "type": "button"}]}
                """)).orElseThrow();

        assertThat(interaction.userId()).isEqualTo("U01ABC");
        assertThat(interaction.userName()).isEqualTo("jihyun");
        assertThat(interaction.channelId()).isEqualTo("C0NEWS");
        assertThat(interaction.messageTs()).isEqualTo("1731382200.000100");
        assertThat(interaction.actions()).containsExactly(new SlackInteraction.Action("news_exclude", "7:123"));
    }

    @Test
    @DisplayName("버튼 요청이 아니거나 누른 사람·채널·버튼이 없으면 처리하지 않는다")
    void ignoresOtherPayloads() {
        assertThat(SlackInteraction.from(mapper.readTree("{\"type\": \"view_submission\"}"))).isEmpty();
        assertThat(SlackInteraction.from(mapper.readTree("""
                {"type": "block_actions", "channel": {"id": "C1"}, "actions": [{"action_id": "a"}]}"""))).isEmpty();
        assertThat(SlackInteraction.from(mapper.readTree("""
                {"type": "block_actions", "user": {"id": "U1"}, "actions": [{"action_id": "a"}]}"""))).isEmpty();
        assertThat(SlackInteraction.from(mapper.readTree("""
                {"type": "block_actions", "user": {"id": "U1"}, "channel": {"id": "C1"}, "actions": []}"""))).isEmpty();
    }

    @Test
    @DisplayName("값이 없는 버튼도 읽는다")
    void readsActionWithoutValue() {
        SlackInteraction interaction = SlackInteraction.from(mapper.readTree("""
                {"type": "block_actions", "user": {"id": "U1"}, "channel": {"id": "C1"},
                 "actions": [{"action_id": "news_recollect"}]}""")).orElseThrow();

        assertThat(interaction.actions().getFirst().value()).isNull();
        assertThat(interaction.userName()).isNull();
        assertThat(interaction.messageTs()).isNull();
    }
}

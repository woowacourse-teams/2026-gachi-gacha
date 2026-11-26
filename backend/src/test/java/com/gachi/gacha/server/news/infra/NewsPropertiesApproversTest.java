package com.gachi.gacha.server.news.infra;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class NewsPropertiesApproversTest {

    @Test
    @DisplayName("승인자는 '슬랙회원ID:가치가챠회원ID' 이고, 슬랙 회원 ID 로 승인자인지와 가치가챠 회원 ID 를 알 수 있다")
    void readsApprovers() {
        NewsProperties.Slack slack = new NewsProperties.Slack(null, null, null, List.of(" U01ABC:12 ", "U02DEF:34", ""));

        assertThat(slack.approvers()).containsExactly("U01ABC:12", "U02DEF:34");
        assertThat(slack.isApprover("U01ABC")).isTrue();
        assertThat(slack.approverMemberId("U02DEF")).contains(34L);
        assertThat(slack.isApprover("U99999")).isFalse();
        assertThat(slack.isApprover(null)).isFalse();
        assertThat(slack.approverMemberId("U99999")).isEmpty();
    }

    @Test
    @DisplayName("형식이 틀린 승인자는 앱이 뜨지 않게 막는다")
    void rejectsMalformedApprovers() {
        assertThatThrownBy(() -> new NewsProperties.Slack(null, null, null, List.of("U01ABC")))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("U01ABC");
        assertThatThrownBy(() -> new NewsProperties.Slack(null, null, null, List.of("U01ABC:")))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new NewsProperties.Slack(null, null, null, List.of(":12")))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new NewsProperties.Slack(null, null, null, List.of("U01ABC:abc")))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("숫자");
    }
}

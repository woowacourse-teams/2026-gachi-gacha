package com.gachi.gacha.server.notification.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PushMessageTest {

    @Test
    @DisplayName("신상 소식 푸시는 앱이 탭으로 이동할 수 있게 type=NEWS 와 주제를 담고, 주제 단위로 묶는다")
    void ofNews() {
        PushMessage message = PushMessage.ofNews("CHIIKAWA", "치이카와 신상 소식", "[발매 11/27(금)~] 신상품 외 1건", false);

        assertThat(message.title()).isEqualTo("치이카와 신상 소식");
        assertThat(message.body()).isEqualTo("[발매 11/27(금)~] 신상품 외 1건");
        assertThat(message.data()).isEqualTo(Map.of("type", "NEWS", "topic", "CHIIKAWA"));
        assertThat(message.collapseKey()).isEqualTo("news-CHIIKAWA");
    }

    @Test
    @DisplayName("테스트 발송은 test=true 를 담고, 진짜 알림을 교체하지 않도록 묶지 않는다")
    void ofNewsTest() {
        PushMessage message = PushMessage.ofNews("CHIIKAWA", "[테스트] 치이카와 신상 소식", "본문", true);

        assertThat(message.data()).containsEntry("type", "NEWS").containsEntry("topic", "CHIIKAWA").containsEntry("test", "true");
        assertThat(message.collapseKey()).isNull();
    }

    @Test
    @DisplayName("채팅 푸시는 기존과 같다")
    void chatIsUnchanged() {
        PushMessage message = PushMessage.ofChat(7L, "철수", "안녕");

        assertThat(message.data()).isEqualTo(Map.of("type", "CHAT", "roomId", "7"));
        assertThat(message.collapseKey()).isEqualTo("chat-7");
    }
}

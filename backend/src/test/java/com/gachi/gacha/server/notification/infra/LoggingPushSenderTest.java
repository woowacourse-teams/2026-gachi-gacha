package com.gachi.gacha.server.notification.infra;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.notification.application.PushMessage;
import com.gachi.gacha.server.notification.application.PushResult;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class LoggingPushSenderTest {

    private final LoggingPushSender sender = new LoggingPushSender();
    private final PushMessage message = new PushMessage("제목", "본문", Map.of("type", "NEWS"), "news-CHIIKAWA");

    @Test
    @DisplayName("실제로 보내지 않고 모든 수가 0인 결과를 돌려준다. 보낸 토큰 수와 합이 맞지 않으면 보내지 않은 것이다")
    void doesNotSendAndReportsNothing() {
        assertThat(sender.sendWithResult(List.of("a", "b"), message)).isEqualTo(PushResult.NONE);
    }

    @Test
    @DisplayName("기존 send 도 무효 토큰 없이 빈 목록을 돌려준다")
    void legacySendReturnsEmpty() {
        assertThat(sender.send(List.of("a", "b"), message)).isEmpty();
    }
}

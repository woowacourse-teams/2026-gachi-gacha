package com.gachi.gacha.server.notification.infra;

import com.gachi.gacha.server.notification.application.PushMessage;
import com.gachi.gacha.server.notification.application.PushSender;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.stereotype.Component;

/**
 * Firebase 키가 없는 로컬·테스트 환경용. 실제로 보내지 않고 무엇을 보냈을지만 남긴다.
 */
@Slf4j
@Component
@ConditionalOnBooleanProperty(name = "firebase.push-enabled", havingValue = false, matchIfMissing = true)
public class LoggingPushSender implements PushSender {

    @Override
    public List<String> send(final List<String> tokens, final PushMessage message) {
        log.info("[푸시 미발송] firebase.push-enabled=false. tokenCount = {}, title = {}, data = {}",
                tokens.size(), message.title(), message.data());
        return List.of();
    }
}

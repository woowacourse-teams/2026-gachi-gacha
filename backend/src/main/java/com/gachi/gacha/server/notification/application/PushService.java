package com.gachi.gacha.server.notification.application;

import com.gachi.gacha.server.notification.domain.PushToken;
import com.gachi.gacha.server.notification.domain.PushTokenJpaRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 외부 호출인 FCM 발송이 DB 커넥션을 붙잡지 않도록 트랜잭션 없이 실행한다.
 * 토큰 조회와 무효 토큰 삭제는 저장소 호출마다 짧은 트랜잭션으로 끝난다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PushService {

    private final PushTokenJpaRepository pushTokenJpaRepository;
    private final PushSender pushSender;

    public void sendTo(final Long memberId, final PushMessage message) {
        List<String> tokens = pushTokenJpaRepository.findAllByMemberId(memberId)
                .stream()
                .map(PushToken::getToken)
                .toList();
        if (tokens.isEmpty()) {
            log.debug("푸시 생략: 등록된 토큰 없음. memberId = {}", memberId);
            return;
        }

        List<String> invalidTokens = pushSender.send(tokens, message);
        if (!invalidTokens.isEmpty()) {
            pushTokenJpaRepository.deleteAllByTokenIn(invalidTokens);
            log.info("무효 푸시 토큰 삭제. memberId = {}, deletedCount = {}", memberId, invalidTokens.size());
        }
    }
}

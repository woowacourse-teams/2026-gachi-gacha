package com.gachi.gacha.server.notification.application;

import com.gachi.gacha.server.notification.application.dto.PushTokenRegisterCommand;
import com.gachi.gacha.server.notification.domain.PushToken;
import com.gachi.gacha.server.notification.domain.PushTokenJpaRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PushTokenService {

    private final PushTokenJpaRepository pushTokenJpaRepository;

    /**
     * 같은 기기에서 다른 계정으로 로그인하면 같은 토큰이 다시 들어온다. 새로 만들지 않고 지금 회원으로 옮겨야
     * 이전 계정의 알림이 그 기기로 가지 않는다.
     */
    @Transactional
    public void register(final Long memberId, final PushTokenRegisterCommand command) {
        pushTokenJpaRepository.findByToken(command.token())
                .ifPresentOrElse(
                        pushToken -> reassign(pushToken, memberId),
                        () -> pushTokenJpaRepository.save(PushToken.of(memberId, command.token(), command.platform()))
                );
    }

    @Transactional
    public void unregister(final Long memberId, final String token) {
        pushTokenJpaRepository.findByToken(token)
                .ifPresent(pushToken -> deleteIfOwned(pushToken, memberId));
    }

    @Transactional
    public void deleteInvalidTokens(final List<String> tokens) {
        pushTokenJpaRepository.deleteAllByTokenIn(tokens);
    }

    private void reassign(final PushToken pushToken, final Long memberId) {
        if (!pushToken.isOwnedBy(memberId)) {
            log.info("푸시 토큰 소유 회원 변경. pushTokenId = {}, fromMemberId = {}, toMemberId = {}",
                    pushToken.getId(), pushToken.getMemberId(), memberId);
        }
        pushToken.assignTo(memberId);
    }

    /**
     * 다른 회원의 토큰은 지우지 않는다. 정상 흐름에서는 나오기 어려운 요청이라 경고로 남긴다.
     */
    private void deleteIfOwned(final PushToken pushToken, final Long memberId) {
        if (!pushToken.isOwnedBy(memberId)) {
            log.warn("다른 회원의 푸시 토큰 삭제 요청 무시. pushTokenId = {}, ownerId = {}, requesterId = {}",
                    pushToken.getId(), pushToken.getMemberId(), memberId);
            return;
        }
        pushTokenJpaRepository.delete(pushToken);
    }
}

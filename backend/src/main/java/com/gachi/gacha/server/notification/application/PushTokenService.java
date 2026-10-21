package com.gachi.gacha.server.notification.application;

import com.gachi.gacha.server.notification.application.dto.PushTokenRegisterCommand;
import com.gachi.gacha.server.notification.domain.PushToken;
import com.gachi.gacha.server.notification.domain.PushTokenJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                        pushToken -> pushToken.assignTo(memberId),
                        () -> pushTokenJpaRepository.save(PushToken.of(memberId, command.token(), command.platform()))
                );
    }

    @Transactional
    public void unregister(final Long memberId, final String token) {
        pushTokenJpaRepository.findByToken(token)
                .filter(pushToken -> pushToken.isOwnedBy(memberId))
                .ifPresent(pushTokenJpaRepository::delete);
    }
}

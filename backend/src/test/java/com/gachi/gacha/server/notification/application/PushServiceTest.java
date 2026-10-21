package com.gachi.gacha.server.notification.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.notification.domain.PushPlatform;
import com.gachi.gacha.server.notification.domain.PushToken;
import com.gachi.gacha.server.notification.domain.PushTokenJpaRepository;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@SpringBootTest
class PushServiceTest {

    private static final PushMessage MESSAGE = new PushMessage("제목", "본문", Map.of("type", "COMMENT"), null);

    @Autowired
    private PushService pushService;

    @Autowired
    private PushTokenJpaRepository pushTokenJpaRepository;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @MockitoBean
    private PushSender pushSender;

    private Member member;

    @BeforeEach
    void setUp() {
        member = memberJpaRepository.save(Member.builder().nickname("member").build());
    }

    @Test
    @DisplayName("회원의 모든 기기 토큰으로 푸시를 보낸다")
    void sendTo_allTokensOfMember() {
        // given
        pushTokenJpaRepository.save(PushToken.of(member.getId(), "android-token", PushPlatform.ANDROID));
        pushTokenJpaRepository.save(PushToken.of(member.getId(), "ios-token", PushPlatform.IOS));
        given(pushSender.send(anyList(), any())).willReturn(List.of());

        // when
        pushService.sendTo(member.getId(), MESSAGE);

        // then
        verify(pushSender).send(
                argThat(tokens -> tokens.containsAll(List.of("android-token", "ios-token"))),
                eq(MESSAGE)
        );
    }

    @Test
    @DisplayName("등록된 토큰이 없으면 발송하지 않는다")
    void sendTo_noToken() {
        // when
        pushService.sendTo(member.getId(), MESSAGE);

        // then
        verify(pushSender, never()).send(anyList(), any());
    }

    @Test
    @DisplayName("발송 결과 무효로 확인된 토큰은 삭제한다")
    void sendTo_deletesInvalidTokens() {
        // given
        pushTokenJpaRepository.save(PushToken.of(member.getId(), "valid-token", PushPlatform.ANDROID));
        pushTokenJpaRepository.save(PushToken.of(member.getId(), "invalid-token", PushPlatform.IOS));
        given(pushSender.send(anyList(), any())).willReturn(List.of("invalid-token"));

        // when
        pushService.sendTo(member.getId(), MESSAGE);

        // then
        assertThat(pushTokenJpaRepository.findAllByMemberId(member.getId()))
                .extracting(PushToken::getToken)
                .containsExactly("valid-token");
    }
}

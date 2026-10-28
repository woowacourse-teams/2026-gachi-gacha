package com.gachi.gacha.server.notification.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.notification.application.dto.PushTokenRegisterCommand;
import com.gachi.gacha.server.notification.domain.PushPlatform;
import com.gachi.gacha.server.notification.domain.PushToken;
import com.gachi.gacha.server.notification.domain.PushTokenJpaRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@SpringBootTest
class PushTokenServiceTest {

    private static final String TOKEN = "fcm-token";

    @Autowired
    private PushTokenService pushTokenService;

    @Autowired
    private PushTokenJpaRepository pushTokenJpaRepository;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    private Member member;
    private Member other;

    @BeforeEach
    void setUp() {
        member = memberJpaRepository.save(Member.builder().nickname("member").build());
        other = memberJpaRepository.save(Member.builder().nickname("other").build());
    }

    @Nested
    @DisplayName("푸시 토큰 등록")
    class Register {

        @Test
        @DisplayName("처음 보는 토큰이면 회원의 토큰으로 저장한다")
        void register_newToken() {
            // when
            pushTokenService.register(member.getId(), new PushTokenRegisterCommand(TOKEN, PushPlatform.IOS));

            // then
            assertThat(pushTokenJpaRepository.findByToken(TOKEN))
                    .hasValueSatisfying(pushToken -> {
                        assertThat(pushToken.getMemberId()).isEqualTo(member.getId());
                        assertThat(pushToken.getPlatform()).isEqualTo(PushPlatform.IOS);
                    });
        }

        @Test
        @DisplayName("같은 회원이 같은 토큰을 다시 등록해도 하나만 남는다")
        void register_sameMemberAgain() {
            // given
            pushTokenService.register(member.getId(), new PushTokenRegisterCommand(TOKEN, PushPlatform.IOS));

            // when
            pushTokenService.register(member.getId(), new PushTokenRegisterCommand(TOKEN, PushPlatform.IOS));

            // then
            assertThat(pushTokenJpaRepository.findAllByMemberId(member.getId())).hasSize(1);
        }

        @Test
        @DisplayName("다른 회원이 쓰던 토큰이면 새로 만들지 않고 지금 회원으로 옮긴다")
        void register_reassignToken() {
            // given
            pushTokenService.register(other.getId(), new PushTokenRegisterCommand(TOKEN, PushPlatform.IOS));

            // when
            pushTokenService.register(member.getId(), new PushTokenRegisterCommand(TOKEN, PushPlatform.IOS));

            // then
            assertThat(pushTokenJpaRepository.findAllByMemberId(other.getId())).isEmpty();
            assertThat(pushTokenJpaRepository.findAllByMemberId(member.getId()))
                    .extracting(PushToken::getToken)
                    .containsExactly(TOKEN);
        }
    }

    @Nested
    @DisplayName("푸시 토큰 삭제")
    class Unregister {

        @Test
        @DisplayName("내 토큰이면 삭제한다")
        void unregister_ownToken() {
            // given
            pushTokenService.register(member.getId(), new PushTokenRegisterCommand(TOKEN, PushPlatform.ANDROID));

            // when
            pushTokenService.unregister(member.getId(), TOKEN);

            // then
            assertThat(pushTokenJpaRepository.findByToken(TOKEN)).isEmpty();
        }

        @Test
        @DisplayName("다른 회원의 토큰이면 삭제하지 않는다")
        void unregister_othersToken() {
            // given
            pushTokenService.register(other.getId(), new PushTokenRegisterCommand(TOKEN, PushPlatform.ANDROID));

            // when
            pushTokenService.unregister(member.getId(), TOKEN);

            // then
            assertThat(pushTokenJpaRepository.findByToken(TOKEN)).isPresent();
        }
    }

    @Nested
    @DisplayName("무효 토큰 삭제")
    class DeleteInvalidTokens {

        @Test
        @DisplayName("전달한 토큰만 회원과 관계없이 삭제한다")
        void deleteInvalidTokens() {
            // given
            pushTokenService.register(member.getId(), new PushTokenRegisterCommand("invalid-token", PushPlatform.ANDROID));
            pushTokenService.register(other.getId(), new PushTokenRegisterCommand("other-invalid-token", PushPlatform.IOS));
            pushTokenService.register(member.getId(), new PushTokenRegisterCommand("valid-token", PushPlatform.IOS));

            // when
            pushTokenService.deleteInvalidTokens(List.of("invalid-token", "other-invalid-token"));

            // then
            assertThat(pushTokenJpaRepository.findByToken("invalid-token")).isEmpty();
            assertThat(pushTokenJpaRepository.findByToken("other-invalid-token")).isEmpty();
            assertThat(pushTokenJpaRepository.findByToken("valid-token")).isPresent();
        }
    }
}

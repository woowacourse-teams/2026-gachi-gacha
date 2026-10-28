package com.gachi.gacha.server.notification.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@SpringBootTest
class PushTokenJpaRepositoryTest {

    @Autowired
    private PushTokenJpaRepository pushTokenJpaRepository;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    private Member member;

    @BeforeEach
    void setUp() {
        member = memberJpaRepository.save(Member.builder().nickname("member").build());
    }

    @Test
    @DisplayName("한 회원의 여러 기기 토큰을 저장하고 조회한다")
    void findAllByMemberId() {
        // given
        PushToken android = pushTokenJpaRepository.save(
                PushToken.of(member.getId(), "android-token", PushPlatform.ANDROID)
        );
        PushToken ios = pushTokenJpaRepository.save(
                PushToken.of(member.getId(), "ios-token", PushPlatform.IOS)
        );

        // when & then
        assertThat(pushTokenJpaRepository.findAllByMemberId(member.getId())).containsExactlyInAnyOrder(android, ios);
        assertThat(pushTokenJpaRepository.findByToken("ios-token")).contains(ios);
    }

    @Test
    @DisplayName("같은 토큰은 두 번 저장할 수 없다")
    void duplicateToken() {
        // given
        Member other = memberJpaRepository.save(Member.builder().nickname("other").build());
        pushTokenJpaRepository.saveAndFlush(PushToken.of(member.getId(), "same-token", PushPlatform.IOS));

        // when & then
        assertThatThrownBy(() -> pushTokenJpaRepository.saveAndFlush(
                PushToken.of(other.getId(), "same-token", PushPlatform.IOS)
        )).isInstanceOf(DataIntegrityViolationException.class);
    }
}

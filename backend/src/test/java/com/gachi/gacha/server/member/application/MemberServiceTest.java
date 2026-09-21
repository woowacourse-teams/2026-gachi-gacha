package com.gachi.gacha.server.member.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gachi.gacha.server.member.application.dto.MemberDeleteResult;
import com.gachi.gacha.server.member.application.dto.MemberInfo;
import com.gachi.gacha.server.member.application.dto.MemberUpdateCommand;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.exception.MemberNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@SpringBootTest
class MemberServiceTest {

    @Autowired
    private MemberService memberService;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    private Member savedMember;

    @BeforeEach
    void setUp() {
        Member member = Member.builder()
                .oauthId(new OauthId("12345", OauthProviderType.KAKAO))
                .oauthUsername("oauthUser")
                .nickname("woni")
                .profileImageUrl("https://image.com/profile.png")
                .desireTradeLocation("서울시 강남구")
                .build();
        savedMember = memberJpaRepository.save(member);
    }

    @Nested
    @DisplayName("회원 정보 조회")
    class GetMemberInfo {

        @Test
        @DisplayName("존재하는 회원 ID로 조회하면 회원 정보를 반환한다")
        void getMemberInfo_success() {
            // when
            MemberInfo result = memberService.getMemberInfo(savedMember.getId());

            // then
            assertThat(result.nickname()).isEqualTo("woni");
            assertThat(result.profileImageUrl()).isEqualTo("https://image.com/profile.png");
        }

        @Test
        @DisplayName("존재하지 않는 회원 ID로 조회하면 예외가 발생한다")
        void getMemberInfo_notFound() {
            // when & then
            assertThatThrownBy(() -> memberService.getMemberInfo(9999999L))
                    .isInstanceOf(MemberNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("회원 정보 수정")
    class ModifyMember {

        @Test
        @DisplayName("닉네임과 프로필 이미지를 수정하면 변경된 정보를 반환하고 DB에 반영된다")
        void modifyMember_success() {
            // given
            MemberUpdateCommand command = MemberUpdateCommand.builder()
                    .nickname("newNickname")
                    .profileImageUrl("https://image.com/new.png")
                    .desireTradeLocation("서울시 서초구")
                    .build();

            // when
            MemberInfo result = memberService.modifyMember(savedMember.getId(), command);

            // then
            assertThat(result.nickname()).isEqualTo("newNickname");
            assertThat(result.profileImageUrl()).isEqualTo("https://image.com/new.png");
            assertThat(result.desireTradeLocation()).isEqualTo("서울시 서초구");
            Member reloaded = memberJpaRepository.getMemberById(savedMember.getId());
            assertThat(reloaded.getNickname()).isEqualTo("newNickname");
            assertThat(reloaded.getProfileImageUrl()).isEqualTo("https://image.com/new.png");
            assertThat(reloaded.getDesireTradeLocation()).isEqualTo("서울시 서초구");
        }
    }

    @Nested
    @DisplayName("회원 삭제")
    class RemoveMember {

        @Test
        @DisplayName("존재하는 회원을 삭제하면 삭제 결과를 반환하고 조회되지 않는다")
        void removeMember_success() {
            // when
            MemberDeleteResult result = memberService.removeMember(savedMember.getId());

            // then
            assertThat(result.memberId()).isEqualTo(savedMember.getId());

            assertThatThrownBy(() -> memberJpaRepository.getMemberById(savedMember.getId()))
                    .isInstanceOf(MemberNotFoundException.class);
        }
    }
}

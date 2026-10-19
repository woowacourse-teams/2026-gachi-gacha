package com.gachi.gacha.server.member.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import com.gachi.gacha.server.member.application.dto.BlockedMemberInfo;
import com.gachi.gacha.server.member.application.dto.MemberBlockResult;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberBlockJpaRepository;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.exception.MemberNotFoundException;
import com.gachi.gacha.server.member.domain.exception.SelfBlockNotAllowedException;
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
class MemberBlockServiceTest {

    @Autowired
    private MemberBlockService memberBlockService;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private MemberBlockJpaRepository memberBlockJpaRepository;

    private Member blocker;
    private Member blocked;

    @BeforeEach
    void setUp() {
        blocker = memberJpaRepository.save(Member.builder().nickname("blocker").build());
        blocked = memberJpaRepository.save(Member.builder().nickname("blocked").build());
    }

    @Nested
    @DisplayName("회원 차단")
    class Block {

        @Test
        @DisplayName("다른 회원을 차단하면 차단 관계를 저장하고 차단 시각을 반환한다")
        void block_success() {
            // when
            MemberBlockResult result = memberBlockService.block(blocker.getId(), blocked.getId());

            // then
            assertThat(result.memberId()).isEqualTo(blocked.getId());
            assertThat(result.blockedAt()).isNotNull();
            assertThat(memberBlockJpaRepository.existsBetween(blocker.getId(), blocked.getId())).isTrue();
        }

        @Test
        @DisplayName("이미 차단한 회원을 다시 차단하면 새로 저장하지 않고 최초 차단 시각을 반환한다")
        void block_alreadyBlocked() {
            // given
            MemberBlockResult first = memberBlockService.block(blocker.getId(), blocked.getId());

            // when
            MemberBlockResult second = memberBlockService.block(blocker.getId(), blocked.getId());

            // then
            assertThat(second.blockedAt()).isEqualTo(first.blockedAt());
            assertThat(memberBlockJpaRepository.findAllByBlockerIdOrderByCreatedAtDesc(blocker.getId())).hasSize(1);
        }

        @Test
        @DisplayName("자기 자신을 차단하면 예외가 발생한다")
        void block_self() {
            // when & then
            assertThatThrownBy(() -> memberBlockService.block(blocker.getId(), blocker.getId()))
                    .isInstanceOf(SelfBlockNotAllowedException.class);
        }

        @Test
        @DisplayName("존재하지 않는 회원을 차단하면 예외가 발생한다")
        void block_memberNotFound() {
            // when & then
            assertThatThrownBy(() -> memberBlockService.block(blocker.getId(), 9999999L))
                    .isInstanceOf(MemberNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("회원 차단 해제")
    class Unblock {

        @Test
        @DisplayName("차단한 회원을 해제하면 차단 관계가 사라진다")
        void unblock_success() {
            // given
            memberBlockService.block(blocker.getId(), blocked.getId());

            // when
            memberBlockService.unblock(blocker.getId(), blocked.getId());

            // then
            assertThat(memberBlockJpaRepository.existsBetween(blocker.getId(), blocked.getId())).isFalse();
        }

        @Test
        @DisplayName("차단하지 않은 회원을 해제해도 예외 없이 처리한다")
        void unblock_notBlocked() {
            // when & then
            assertThatCode(() -> memberBlockService.unblock(blocker.getId(), blocked.getId()))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("상대가 나를 차단한 관계는 내가 해제할 수 없다")
        void unblock_onlyOwnBlock() {
            // given
            memberBlockService.block(blocked.getId(), blocker.getId());

            // when
            memberBlockService.unblock(blocker.getId(), blocked.getId());

            // then
            assertThat(memberBlockJpaRepository.findByBlockerIdAndBlockedId(blocked.getId(), blocker.getId()))
                    .isPresent();
        }
    }

    @Nested
    @DisplayName("내 차단 목록 조회")
    class GetBlockedMembers {

        @Test
        @DisplayName("내가 차단한 회원만 최근 차단 순으로 닉네임과 함께 반환한다")
        void getBlockedMembers_success() {
            // given
            Member another = memberJpaRepository.save(Member.builder().nickname("another").build());
            memberBlockService.block(blocker.getId(), blocked.getId());
            memberBlockService.block(blocker.getId(), another.getId());
            memberBlockService.block(another.getId(), blocker.getId());

            // when
            List<BlockedMemberInfo> result = memberBlockService.getBlockedMembers(blocker.getId());

            // then
            assertThat(result)
                    .extracting(BlockedMemberInfo::memberId, BlockedMemberInfo::nickname)
                    .containsExactly(
                            tuple(another.getId(), "another"),
                            tuple(blocked.getId(), "blocked")
                    );
        }

        @Test
        @DisplayName("탈퇴한 회원은 차단 목록에서 제외한다")
        void getBlockedMembers_excludesDeletedMember() {
            // given
            memberBlockService.block(blocker.getId(), blocked.getId());
            memberJpaRepository.delete(blocked);

            // when
            List<BlockedMemberInfo> result = memberBlockService.getBlockedMembers(blocker.getId());

            // then
            assertThat(result).isEmpty();
        }
    }
}

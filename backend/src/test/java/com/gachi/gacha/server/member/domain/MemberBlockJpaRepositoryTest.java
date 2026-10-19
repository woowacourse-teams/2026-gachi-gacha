package com.gachi.gacha.server.member.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class MemberBlockJpaRepositoryTest {

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private MemberBlockJpaRepository memberBlockJpaRepository;

    @Test
    void findsBlockInEitherDirectionAndKeepsCreatedTime() {
        Member first = memberJpaRepository.save(Member.builder().nickname("first").build());
        Member second = memberJpaRepository.save(Member.builder().nickname("second").build());
        Member third = memberJpaRepository.save(Member.builder().nickname("third").build());

        MemberBlock saved = memberBlockJpaRepository.saveAndFlush(
                MemberBlock.of(first.getId(), second.getId())
        );

        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(memberBlockJpaRepository.existsBetween(first.getId(), second.getId())).isTrue();
        assertThat(memberBlockJpaRepository.existsBetween(second.getId(), first.getId())).isTrue();
        assertThat(memberBlockJpaRepository.existsBetween(first.getId(), third.getId())).isFalse();
        assertThat(memberBlockJpaRepository.findByBlockerIdAndBlockedId(first.getId(), second.getId()))
                .contains(saved);
        assertThat(memberBlockJpaRepository.findAllByBlockerIdOrderByCreatedAtDesc(first.getId()))
                .containsExactly(saved);
    }
}

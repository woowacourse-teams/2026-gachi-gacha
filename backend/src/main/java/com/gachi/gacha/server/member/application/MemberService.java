package com.gachi.gacha.server.member.application;

import com.gachi.gacha.server.member.application.dto.MemberDeleteResult;
import com.gachi.gacha.server.member.application.dto.MemberInfo;
import com.gachi.gacha.server.member.application.dto.MemberUpdateCommand;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberJpaRepository memberJpaRepository;

    public MemberInfo getMemberInfo(final Long memberId) {
        Member member = memberJpaRepository.getMemberById(memberId);
        return MemberInfo.from(member);
    }

    @Transactional
    public MemberInfo modifyMember(final Long memberId, final MemberUpdateCommand command) {
        Member member = memberJpaRepository.getMemberById(memberId);
        member.updateProfile(command.nickname(), command.profileImageUrl(), command.desireTradeLocation());
        return MemberInfo.from(member);
    }

    @Transactional
    public MemberDeleteResult removeMember(final Long memberId) {
        Member member = memberJpaRepository.getMemberById(memberId);
        memberJpaRepository.delete(member);
        return new MemberDeleteResult(memberId);
    }
}

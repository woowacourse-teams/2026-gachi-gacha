package com.gachi.gacha.server.member.application;

import com.gachi.gacha.server.member.application.dto.MemberDeleteResult;
import com.gachi.gacha.server.member.application.dto.MemberInfo;
import com.gachi.gacha.server.member.application.dto.MemberUpdateCommand;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;

    public MemberInfo getMemberInfo(Long memberId) {
        Member member = memberRepository.getMemberById(memberId);
        return MemberInfo.from(member);
    }

    @Transactional
    public MemberInfo modifyMember(Long memberId, MemberUpdateCommand command) {
        Member member = memberRepository.getMemberById(memberId);
        member.updateProfile(command.nickname(), command.profileImageUrl(), command.desireTradeLocation());
        return MemberInfo.from(member);
    }

    @Transactional
    public MemberDeleteResult removeMember(Long memberId) {
        Member member = memberRepository.getMemberById(memberId);
        memberRepository.delete(member);
        return new MemberDeleteResult(memberId);
    }
}

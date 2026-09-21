package com.gachi.gacha.server.member.application;

import com.gachi.gacha.server.member.application.dto.MemberDeleteResult;
import com.gachi.gacha.server.member.application.dto.MemberInfo;
import com.gachi.gacha.server.member.application.dto.MemberUpdateCommand;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.trade.application.TradeService;
import com.gachi.gacha.server.trade.application.dto.TradeSummaryInfo;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberJpaRepository memberJpaRepository;
    private final TradeService tradeService;

    public MemberInfo getMemberInfo(Long memberId) {
        Member member = memberJpaRepository.getMemberById(memberId);
        return MemberInfo.from(member);
    }

    @Transactional
    public MemberInfo modifyMember(Long memberId, MemberUpdateCommand command) {
        Member member = memberJpaRepository.getMemberById(memberId);
        member.updateProfile(command.nickname(), command.profileImageUrl(), command.desireTradeLocation());
        return MemberInfo.from(member);
    }

    @Transactional
    public MemberDeleteResult removeMember(Long memberId) {
        Member member = memberJpaRepository.getMemberById(memberId);
        memberJpaRepository.delete(member);
        return new MemberDeleteResult(memberId);
    }

    public List<TradeSummaryInfo> getMemberTradeInfo(Long memberId) {
        return tradeService.findAllByMemberId(memberId);
    }
}

package com.gachi.gacha.server.member.application;

import com.gachi.gacha.server.member.application.dto.MemberDeleteResult;
import com.gachi.gacha.server.member.application.dto.MemberInfo;
import com.gachi.gacha.server.member.application.dto.MemberUpdateCommand;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.trade.application.TradeService;
import com.gachi.gacha.server.trade.application.dto.TradeSummaryInfo;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberJpaRepository memberJpaRepository;
    private final TradeService tradeService;

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

    public Page<TradeSummaryInfo> getMemberTradeInfo(final Long memberId, final TradeStatus status, final Pageable pageable) {
        return tradeService.findAllByMemberId(memberId, status, pageable);
    }
}

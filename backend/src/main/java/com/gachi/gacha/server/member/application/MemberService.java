package com.gachi.gacha.server.member.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.application.dto.MemberDeleteResult;
import com.gachi.gacha.server.member.application.dto.MemberInfo;
import com.gachi.gacha.server.member.application.dto.MemberUpdateCommand;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.exception.InvalidOauthStateException;
import com.gachi.gacha.server.notification.domain.PushTokenJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberJpaRepository memberJpaRepository;
    private final PushTokenJpaRepository pushTokenJpaRepository;
    private final TokenService tokenService;

    public MemberInfo getMemberInfo(final Long memberId) {
        Member member = memberJpaRepository.getMemberById(memberId);
        return MemberInfo.from(member);
    }

    @Transactional
    public MemberInfo modifyMember(final Long memberId, final MemberUpdateCommand command) {
        Member member = memberJpaRepository.getMemberById(memberId);
        member.patch(command.nickname(), command.profileImageUrl(), command.desireTradeLocation());
        return MemberInfo.from(member);
    }

    public MemberDeleteResult withdrawWithoutReauth(final Long memberId) {
        Member member = memberJpaRepository.getMemberById(memberId);
        if (member.getOauthId().getOauthProvider() == OauthProviderType.APPLE) {
            throw new InvalidOauthStateException(ErrorCode.INVALID_OAUTH_STATE);
        }
        return removeMember(memberId);
    }

    @Transactional
    public MemberDeleteResult removeMember(final Long memberId) {
        tokenService.revokeAll(memberId);
        pushTokenJpaRepository.deleteAllByMemberId(memberId);
        Member member = memberJpaRepository.getMemberById(memberId);
        memberJpaRepository.delete(member);
        return new MemberDeleteResult(memberId);
    }
}

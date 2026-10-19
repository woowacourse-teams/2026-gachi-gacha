package com.gachi.gacha.server.member.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.application.dto.BlockedMemberInfo;
import com.gachi.gacha.server.member.application.dto.MemberBlockResult;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberBlock;
import com.gachi.gacha.server.member.domain.MemberBlockJpaRepository;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.exception.BlockedChatNotAllowedException;
import com.gachi.gacha.server.member.domain.exception.MemberNotFoundException;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberBlockService {

    private final MemberBlockJpaRepository memberBlockJpaRepository;
    private final MemberJpaRepository memberJpaRepository;

    @Transactional
    public MemberBlockResult block(final Long blockerId, final Long blockedId) {
        validateMemberExists(blockedId);
        MemberBlock memberBlock = memberBlockJpaRepository.findByBlockerIdAndBlockedId(blockerId, blockedId)
                .orElseGet(() -> memberBlockJpaRepository.save(MemberBlock.of(blockerId, blockedId)));
        return MemberBlockResult.from(memberBlock);
    }

    @Transactional
    public void unblock(final Long blockerId, final Long blockedId) {
        memberBlockJpaRepository.findByBlockerIdAndBlockedId(blockerId, blockedId)
                .ifPresent(memberBlockJpaRepository::delete);
    }

    public List<BlockedMemberInfo> getBlockedMembers(final Long blockerId) {
        List<MemberBlock> memberBlocks = memberBlockJpaRepository.findAllByBlockerIdOrderByCreatedAtDesc(blockerId);
        Map<Long, Member> blockedMembersById = findMembersById(
                memberBlocks.stream()
                        .map(MemberBlock::getBlockedId)
                        .toList()
        );

        // 탈퇴한 회원은 조회되지 않으므로 목록에서 제외한다.
        return memberBlocks.stream()
                .filter(memberBlock -> blockedMembersById.containsKey(memberBlock.getBlockedId()))
                .map(memberBlock -> BlockedMemberInfo.of(
                        memberBlock,
                        blockedMembersById.get(memberBlock.getBlockedId())
                ))
                .toList();
    }

    /**
     * 한 방향 판정이다. 비로그인 조회처럼 차단자가 없으면 차단하지 않은 것으로 본다.
     */
    public boolean hasBlocked(@Nullable final Long blockerId, final Long blockedId) {
        return blockerId != null && memberBlockJpaRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId);
    }

    public boolean isBlockedBetween(final Long memberId, final Long otherMemberId) {
        return memberBlockJpaRepository.existsBetween(memberId, otherMemberId);
    }

    public void validateChatAllowed(final Long memberId, final Long otherMemberId) {
        if (isBlockedBetween(memberId, otherMemberId)) {
            throw new BlockedChatNotAllowedException(ErrorCode.BLOCKED_CHAT_NOT_ALLOWED);
        }
    }

    private void validateMemberExists(final Long memberId) {
        if (!memberJpaRepository.existsById(memberId)) {
            throw new MemberNotFoundException(ErrorCode.MEMBER_NOT_FOUND);
        }
    }

    private Map<Long, Member> findMembersById(final List<Long> memberIds) {
        return memberJpaRepository.findAllById(memberIds)
                .stream()
                .collect(
                        Collectors.toMap(
                                Member::getId,
                                Function.identity()
                        )
                );
    }
}

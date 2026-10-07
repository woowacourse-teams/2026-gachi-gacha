package com.gachi.gacha.server.comment.application;

import com.gachi.gacha.server.comment.application.dto.CommentCreateCommand;
import com.gachi.gacha.server.comment.application.dto.CommentInfo;
import com.gachi.gacha.server.comment.domain.Comment;
import com.gachi.gacha.server.comment.domain.CommentJpaRepository;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CommentService {

    private final CommentJpaRepository commentJpaRepository;
    private final TradeJpaRepository tradeJpaRepository;
    private final MemberJpaRepository memberJpaRepository;

    /**
     * 회원이면 작성 시점의 닉네임·프로필을 복사해 두고, 비회원이면 마스킹된 IP 를 남긴다.
     * 요청의 nickname 은 비회원일 때만 쓰인다.
     */
    @Transactional
    public CommentInfo createComment(
            final Long tradeId,
            @Nullable final Long memberId,
            final String maskedIp,
            final CommentCreateCommand command
    ) {
        tradeJpaRepository.getById(tradeId);

        Comment comment = (memberId == null)
                ? Comment.ofAnonymous(tradeId, command.nickname(), maskedIp, command.content())
                : toMemberComment(tradeId, memberId, command);

        return CommentInfo.from(commentJpaRepository.save(comment));
    }

    public List<CommentInfo> findComments(final Long tradeId) {
        tradeJpaRepository.getById(tradeId);

        return commentJpaRepository.findAllByTradeIdOrderByIdAsc(tradeId).stream()
                .map(CommentInfo::from)
                .toList();
    }

    private Comment toMemberComment(final Long tradeId, final Long memberId, final CommentCreateCommand command) {
        Member member = memberJpaRepository.getMemberById(memberId);

        return Comment.ofMember(
                tradeId,
                memberId,
                member.getNickname(),
                member.getProfileImageUrl(),
                command.content()
        );
    }
}

package com.gachi.gacha.server.chat.application.dto;

import com.gachi.gacha.server.chat.domain.ChatRoom;
import com.gachi.gacha.server.chat.domain.ChatMemberSummary;
import com.gachi.gacha.server.chat.domain.ChatTradeSummary;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.time.LocalDateTime;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record ChatRoomInfo(
        Long roomId,
        TradeSummary trade,
        MemberSummary otherMember,
        @Nullable LastMessageSummary lastMessage,
        long unreadCount,
        LocalDateTime createdAt
) {
    private static final String DELETED_MEMBER_NAME = "탈퇴한 사용자";

    public static ChatRoomInfo of(
            final ChatRoom chatRoom,
            final ChatTradeSummary trade,
            @Nullable final String tradeThumbnailUrl,
            final ChatMemberSummary otherMember,
            final long unreadCount
    ) {
        return of(
                chatRoom.getId(),
                trade.getTradeId(),
                trade.getTitle(),
                trade.getStatus(),
                trade.isRemoved(),
                tradeThumbnailUrl,
                otherMember.getMemberId(),
                otherMember.getNickname(),
                otherMember.getProfileImageUrl(),
                otherMember.isWithdrawn(),
                chatRoom.getLastMessagePreview(),
                chatRoom.getLastMessageAt(),
                unreadCount,
                chatRoom.getCreatedAt()
        );
    }

    public static ChatRoomInfo of(
            final Long roomId,
            final Long tradeId,
            final String tradeTitle,
            final String tradeStatus,
            final boolean tradeDeleted,
            @Nullable final String tradeThumbnailUrl,
            final Long otherMemberId,
            final String otherMemberNickname,
            @Nullable final String otherMemberProfileImageUrl,
            final boolean otherMemberWithdrawn,
            @Nullable final String lastMessagePreview,
            @Nullable final LocalDateTime lastMessageAt,
            final long unreadCount,
            final LocalDateTime createdAt
    ) {
        TradeSummary tradeSummary = TradeSummary.builder()
                .tradeId(tradeId)
                .title(tradeTitle)
                .thumbnailUrl(tradeThumbnailUrl)
                .status(TradeStatus.valueOf(tradeStatus))
                .deleted(tradeDeleted)
                .build();

        MemberSummary otherMemberSummary = MemberSummary.builder()
                .memberId(otherMemberId)
                .nickname(otherMemberWithdrawn ? DELETED_MEMBER_NAME : otherMemberNickname)
                .profileImageUrl(otherMemberWithdrawn ? null : otherMemberProfileImageUrl)
                .withdrawn(otherMemberWithdrawn)
                .build();

        LastMessageSummary lastMessageSummary = lastMessageAt == null
                ? null
                : LastMessageSummary.builder()
                        .preview(lastMessagePreview)
                        .sendAt(lastMessageAt)
                        .build();

        return ChatRoomInfo.builder()
                .roomId(roomId)
                .trade(tradeSummary)
                .otherMember(otherMemberSummary)
                .lastMessage(lastMessageSummary)
                .unreadCount(unreadCount)
                .createdAt(createdAt)
                .build();
    }

    @Builder
    public record TradeSummary(
            Long tradeId,
            String title,
            @Nullable String thumbnailUrl,
            TradeStatus status,
            boolean deleted
    ) {

    }

    @Builder
    public record MemberSummary(
            Long memberId,
            String nickname,
            @Nullable String profileImageUrl,
            boolean withdrawn
    ) {

    }

    @Builder
    public record LastMessageSummary(
            String preview,
            LocalDateTime sendAt
    ) {

    }
}

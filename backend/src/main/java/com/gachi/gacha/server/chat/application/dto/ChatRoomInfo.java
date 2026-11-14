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
        TradeSummary tradeSummary = TradeSummary.builder()
                .tradeId(trade.getTradeId())
                .title(trade.getTitle())
                .thumbnailUrl(tradeThumbnailUrl)
                .status(TradeStatus.valueOf(trade.getStatus()))
                .deleted(trade.isRemoved())
                .build();

        boolean withdrawn = otherMember.isWithdrawn();
        MemberSummary otherMemberSummary = MemberSummary.builder()
                .memberId(otherMember.getMemberId())
                .nickname(withdrawn ? DELETED_MEMBER_NAME : otherMember.getNickname())
                .profileImageUrl(withdrawn ? null : otherMember.getProfileImageUrl())
                .withdrawn(withdrawn)
                .build();

        LastMessageSummary lastMessageSummary = getLastMessageSummary(chatRoom);

        return ChatRoomInfo.builder()
                .roomId(chatRoom.getId())
                .trade(tradeSummary)
                .otherMember(otherMemberSummary)
                .lastMessage(lastMessageSummary)
                .unreadCount(unreadCount)
                .createdAt(chatRoom.getCreatedAt())
                .build();
    }

    private static @Nullable LastMessageSummary getLastMessageSummary(final ChatRoom chatRoom) {
        if (chatRoom.getLastMessageAt() == null) {
            return null;
        }
        return LastMessageSummary.builder()
                .preview(chatRoom.getLastMessagePreview())
                .sendAt(chatRoom.getLastMessageAt())
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

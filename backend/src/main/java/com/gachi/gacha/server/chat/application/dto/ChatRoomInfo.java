package com.gachi.gacha.server.chat.application.dto;

import com.gachi.gacha.server.chat.domain.ChatRoom;
import com.gachi.gacha.server.chat.domain.ChatRoomMember;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.trade.domain.Trade;
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
    public static ChatRoomInfo of(
            final ChatRoom chatRoom,
            final ChatRoomMember chatRoomMember,
            final Trade trade,
            @Nullable final String tradeThumbnailUrl,
            final Member otherMember,
            final long unreadCount
    ) {
        TradeSummary tradeSummary = TradeSummary.builder()
                .tradeId(trade.getId())
                .title(trade.getTitle())
                .thumbnailUrl(tradeThumbnailUrl)
                .status(trade.getStatus())
                .build();

        MemberSummary otherMemberSummary = MemberSummary.builder()
                .memberId(otherMember.getId())
                .nickname(otherMember.getNickname())
                .profileImageUrl(otherMember.getProfileImageUrl())
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

    private static long calculateUnreadCount(final ChatRoom chatRoom, final ChatRoomMember chatRoomMember) {
        return Math.max(
                0L,
                chatRoom.getLastMessageSequence() - chatRoomMember.getLastReadMessageSequence()
        );
    }

    @Builder
    public record TradeSummary(
            Long tradeId,
            String title,
            @Nullable String thumbnailUrl,
            TradeStatus status
    ) {

    }

    @Builder
    public record MemberSummary(
            Long memberId,
            String nickname,
            @Nullable String profileImageUrl
    ) {

    }

    @Builder
    public record LastMessageSummary(
            String preview,
            LocalDateTime sendAt
    ) {

    }
}

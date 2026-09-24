package com.gachi.gacha.server.chat.presentation.dto;

import com.gachi.gacha.server.chat.application.dto.ChatRoomInfo;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import java.time.LocalDateTime;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record ChatRoomResponse(
        Long roomId,
        TradeSummaryResponse trade,
        MemberSummaryResponse otherMember,
        @Nullable LastMessageSummaryResponse lastMessage,
        long unreadCount,
        LocalDateTime createdAt
) {

    public static ChatRoomResponse from(final ChatRoomInfo info) {
        return ChatRoomResponse.builder()
                .roomId(info.roomId())
                .trade(TradeSummaryResponse.from(info.trade()))
                .otherMember(MemberSummaryResponse.from(info.otherMember()))
                .lastMessage(LastMessageSummaryResponse.from(info.lastMessage()))
                .unreadCount(info.unreadCount())
                .createdAt(info.createdAt())
                .build();
    }

    @Builder
    public record TradeSummaryResponse(
            Long tradeId,
            String title,
            @Nullable String thumbnailUrl,
            TradeStatus status
    ) {

        private static TradeSummaryResponse from(final ChatRoomInfo.TradeSummary info) {
            return TradeSummaryResponse.builder()
                    .tradeId(info.tradeId())
                    .title(info.title())
                    .thumbnailUrl(info.thumbnailUrl())
                    .status(info.status())
                    .build();
        }
    }

    @Builder
    public record MemberSummaryResponse(
            Long memberId,
            String nickname,
            @Nullable String profileImageUrl
    ) {

        private static MemberSummaryResponse from(final ChatRoomInfo.MemberSummary info) {
            return MemberSummaryResponse.builder()
                    .memberId(info.memberId())
                    .nickname(info.nickname())
                    .profileImageUrl(info.profileImageUrl())
                    .build();
        }
    }

    @Builder
    public record LastMessageSummaryResponse(
            String preview,
            LocalDateTime sendAt
    ) {

        private static @Nullable LastMessageSummaryResponse from(
                final ChatRoomInfo.LastMessageSummary info
        ) {
            if (info == null) {
                return null;
            }

            return LastMessageSummaryResponse.builder()
                    .preview(info.preview())
                    .sendAt(info.sendAt())
                    .build();
        }
    }
}

package com.gachi.gacha.server.chat.application;

import com.gachi.gacha.server.chat.application.dto.ChatRoomInfo;
import com.gachi.gacha.server.chat.domain.ChatRoom;
import com.gachi.gacha.server.chat.domain.ChatRoomMember;
import com.gachi.gacha.server.chat.domain.ChatRoomMemberJpaRepository;
import com.gachi.gacha.server.chat.domain.exception.ChatMemberNotFoundException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeImage;
import com.gachi.gacha.server.trade.domain.TradeImageJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.domain.exception.TradeNotFoundException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatRoomService {
    private final ChatRoomMemberJpaRepository chatRoomMemberJpaRepository;
    private final TradeJpaRepository tradeJpaRepository;
    private final TradeImageJpaRepository tradeImageJpaRepository;

    public List<ChatRoomInfo> getRooms(final Long memberId) {
        List<ChatRoomMember> myChatRoomMembers =
                chatRoomMemberJpaRepository.findMyChatRooms(memberId);

        if (myChatRoomMembers.isEmpty()) {
            return List.of();
        }

        List<Long> chatRoomIds = myChatRoomMembers.stream()
                .map(ChatRoomMember::getChatRoom)
                .map(ChatRoom::getId)
                .toList();

        Map<Long, Member> otherMembersByRoomId =
                findOtherMembersByRoomId(chatRoomIds, memberId);

        List<Long> tradeIds = myChatRoomMembers.stream()
                .map(ChatRoomMember::getChatRoom)
                .map(ChatRoom::getTradeId)
                .distinct()
                .toList();

        Map<Long, Trade> tradesById = findTradesById(tradeIds);
        Map<Long, String> tradeThumbnailUrlsByTradeId =
                findThumbnailUrlsByTradeId(tradeIds);

        return myChatRoomMembers.stream()
                .map(myChatRoomMember -> toChatRoomInfo(
                        myChatRoomMember,
                        otherMembersByRoomId,
                        tradesById,
                        tradeThumbnailUrlsByTradeId
                ))
                .toList();
    }

    private Map<Long, Trade> findTradesById(final List<Long> tradeIds) {
        return tradeJpaRepository.findAllById(tradeIds)
                .stream()
                .collect(
                        Collectors.toMap(
                                Trade::getId,
                                Function.identity()
                        )
                );
    }

    private Map<Long, String> findThumbnailUrlsByTradeId(final List<Long> tradeIds) {
        return tradeImageJpaRepository.findAllByTradeIdInOrderByIdAsc(tradeIds)
                .stream()
                .collect(
                        Collectors.toMap(
                                tradeImage -> tradeImage.getTrade().getId(),
                                TradeImage::getImageUrl,
                                (firstImageUrl, ignored) -> firstImageUrl,
                                HashMap::new
                        )
                );
    }

    private ChatRoomInfo toChatRoomInfo(
            final ChatRoomMember myChatRoomMember,
            final Map<Long, Member> otherMembersByRoomId,
            final Map<Long, Trade> tradesById,
            final Map<Long, String> tradeThumbnailUrlsByTradeId
    ) {

        ChatRoom chatRoom = myChatRoomMember.getChatRoom();
        Long chatRoomId = chatRoom.getId();
        Long tradeId = chatRoom.getTradeId();

        Member otherMember = findOtherMember(otherMembersByRoomId, chatRoomId);
        Trade trade = findTrade(tradesById, tradeId);
        String tradeThumbnail = tradeThumbnailUrlsByTradeId.get(tradeId);

        return ChatRoomInfo.of(
                chatRoom,
                myChatRoomMember,
                trade,
                tradeThumbnail,
                otherMember
        );
    }

    private Member findOtherMember(final Map<Long, Member> otherMembersByRoomId, final Long chatRoomId) {
        Member otherMember = otherMembersByRoomId.get(chatRoomId);
        if (otherMember == null) {
            throw new ChatMemberNotFoundException(ErrorCode.CHAT_MEMBER_NOT_FOUND);
        }
        return otherMember;
    }

    private Trade findTrade(final Map<Long, Trade> tradesById, final Long tradeId) {
        Trade trade = tradesById.get(tradeId);
        if (trade == null) {
            throw new TradeNotFoundException(ErrorCode.TRADE_NOT_FOUND);
        }
        return trade;
    }

    private Map<Long, Member> findOtherMembersByRoomId(
            final List<Long> chatRoomIds,
            final Long memberId
    ) {
        return chatRoomMemberJpaRepository.findOtherMembers(chatRoomIds, memberId)
                .stream()
                .collect(
                        Collectors.toMap(
                                chatRoomMember -> chatRoomMember.getChatRoom().getId(),
                                ChatRoomMember::getMember
                        )
                );

    }
}

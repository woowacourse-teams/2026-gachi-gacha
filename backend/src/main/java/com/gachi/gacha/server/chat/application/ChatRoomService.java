package com.gachi.gacha.server.chat.application;

import com.gachi.gacha.server.chat.application.dto.ChatRoomCreateInfo;
import com.gachi.gacha.server.chat.application.dto.ChatRoomExistenceInfo;
import com.gachi.gacha.server.chat.application.dto.ChatRoomInfo;
import com.gachi.gacha.server.chat.domain.ChatRoom;
import com.gachi.gacha.server.chat.domain.ChatRoomJpaRepository;
import com.gachi.gacha.server.chat.domain.ChatRoomMember;
import com.gachi.gacha.server.chat.domain.ChatRoomMemberJpaRepository;
import com.gachi.gacha.server.chat.domain.exception.ChatMemberNotFoundException;
import com.gachi.gacha.server.chat.domain.exception.ChatRoomAlreadyExistException;
import com.gachi.gacha.server.chat.domain.exception.SelfChatNotAllowedException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeImage;
import com.gachi.gacha.server.trade.domain.TradeImageJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.domain.exception.TradeNotFoundException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
    private final MemberJpaRepository memberJpaRepository;
    private final ChatRoomJpaRepository chatRoomJpaRepository;

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

    public ChatRoomExistenceInfo findRoomExistence(final Long memberId, final Long tradeId) {
        Trade trade = tradeJpaRepository.getById(tradeId);
        validateNotOwner(trade, memberId);

        Optional<ChatRoom> chatRoom = chatRoomMemberJpaRepository.findChatRoom(tradeId, memberId);
        return chatRoom
                .map(room -> ChatRoomExistenceInfo.of(true, room.getId()))
                .orElseGet(() -> ChatRoomExistenceInfo.of(false, null));
    }

    public ChatRoomInfo getRoom(final Long memberId, final Long roomId) {
        ChatRoom chatRoom = chatRoomJpaRepository.getById(roomId);

        ChatRoomMember myChatRoomMember =
                chatRoomMemberJpaRepository.getByRoomIdAndMemberId(roomId, memberId);

        Member otherMember = chatRoomMemberJpaRepository.findOtherMember(roomId, memberId)
                .orElseThrow(() -> new ChatMemberNotFoundException(ErrorCode.CHAT_MEMBER_NOT_FOUND));

        Trade trade = tradeJpaRepository.getById(chatRoom.getTradeId());
        String tradeThumbnailUrl = findThumbnailUrlsByTradeId(List.of(trade.getId()))
                .get(trade.getId());

        return ChatRoomInfo.of(
                chatRoom,
                myChatRoomMember,
                trade,
                tradeThumbnailUrl,
                otherMember
        );
    }

    private void validateNotOwner(final Trade trade, final Long memberId) {
        if (trade.isOwnedBy(memberId)) {
            throw new SelfChatNotAllowedException(ErrorCode.SELF_CHAT_NOT_ALLOWED);
        }
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

    @Transactional
    public ChatRoomCreateInfo createRoom(final Long memberId, final Long tradeId) {
        Trade trade = tradeJpaRepository.getById(tradeId);
        validateNotOwner(trade, memberId);

        Member requester = memberJpaRepository.getMemberById(memberId);
        Member tradeOwner = trade.getMember();

        if (chatRoomMemberJpaRepository.findChatRoom(tradeId, memberId).isPresent()) {
            throw new ChatRoomAlreadyExistException(ErrorCode.CHAT_ROOM_ALREADY_EXISTS);
        }

        ChatRoom newChatRoom = chatRoomJpaRepository.save(ChatRoom.create(tradeId));
        ChatRoomMember ownerMemberShip = ChatRoomMember.join(newChatRoom, tradeOwner);
        ChatRoomMember requesterMemberShip = ChatRoomMember.join(newChatRoom, requester);

        chatRoomMemberJpaRepository.saveAll(List.of(ownerMemberShip, requesterMemberShip));
        return ChatRoomCreateInfo.from(newChatRoom);
    }

    public long getUnreadCount(final Long memberId) {
        return chatRoomMemberJpaRepository.countUnreadMessage(memberId);
    }

    public void validateMember(final Long roomId, final Long memberId) {
        chatRoomMemberJpaRepository.getByRoomIdAndMemberId(roomId, memberId);
    }
}

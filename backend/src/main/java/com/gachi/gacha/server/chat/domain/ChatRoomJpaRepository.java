package com.gachi.gacha.server.chat.domain;

import com.gachi.gacha.server.chat.domain.exception.ChatRoomNotFoundException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatRoomJpaRepository extends JpaRepository<ChatRoom, Long> {

    default ChatRoom getById(@NonNull final Long roomId) {
        return findById(roomId)
                .orElseThrow(() -> new ChatRoomNotFoundException(ErrorCode.CHAT_ROOM_NOT_FOUND));
    }

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT chatRoom
            FROM ChatRoom chatRoom
            WHERE chatRoom.id = :roomId
            """)
    Optional<ChatRoom> findByIdForUpdate(Long roomId);

    default ChatRoom getByIdForUpdate(@NonNull final Long roomId) {
        return findByIdForUpdate(roomId)
                .orElseThrow(() -> new ChatRoomNotFoundException(ErrorCode.CHAT_ROOM_NOT_FOUND));
    }

    Optional<ChatRoom> findByTradeIdAndRequesterId(Long tradeId, Long requesterId);

    /** Trade의 SQLRestriction을 적용하지 않고 삭제된 게시글의 채팅 표시 정보까지 조회한다. */
    @Query(value = """
            SELECT trade.id AS "tradeId",
                   trade.title AS "title",
                   trade.status AS "status",
                   trade.is_deleted AS "deleted"
            FROM trade
            WHERE trade.id IN (:tradeIds)
            """, nativeQuery = true)
    List<ChatTradeSummary> findTradesIncludingDeleted(final List<Long> tradeIds);

    @Query(value = """
            SELECT trade.id AS "tradeId",
                   trade.title AS "title",
                   trade.status AS "status",
                   trade.is_deleted AS "deleted"
            FROM trade
            WHERE trade.id = :tradeId
            """, nativeQuery = true)
    Optional<ChatTradeSummary> findTradeIncludingDeleted(final Long tradeId);

    /** 채팅방 실시간 목록 갱신에 필요한 방·상대·게시글 정보를 한 번에 조회한다. */
    @Query(value = """
            SELECT room.id AS "roomId",
                   my_membership.id AS "myMembershipId",
                   trade.id AS "tradeId",
                   trade.title AS "tradeTitle",
                   trade.status AS "tradeStatus",
                   trade.is_deleted AS "tradeDeleted",
                   (
                       SELECT trade_image.image_url
                       FROM trade_image
                       WHERE trade_image.trade_id = trade.id
                       ORDER BY trade_image.id ASC
                       FETCH FIRST 1 ROW ONLY
                   ) AS "thumbnailUrl",
                   partner.id AS "otherMemberId",
                   partner.nickname AS "otherMemberNickname",
                   partner.profile_image_url AS "otherMemberProfileImageUrl",
                   partner.is_deleted AS "otherMemberDeleted",
                   CASE WHEN EXISTS (
                       SELECT 1
                       FROM member_block block
                       WHERE (block.blocker_id = :memberId AND block.blocked_id = partner.id)
                          OR (block.blocker_id = partner.id AND block.blocked_id = :memberId)
                   ) THEN true ELSE false END AS "blocked",
                   room.last_message_preview AS "lastMessagePreview",
                   room.last_message_at AS "lastMessageAt",
                   GREATEST(room.last_message_sequence - my_membership.last_read_message_sequence, 0)
                       AS "unreadCount",
                   room.created_at AS "createdAt"
            FROM chat_room room
            LEFT JOIN chat_room_member my_membership
              ON my_membership.chat_room_id = room.id
             AND my_membership.member_id = :memberId
            LEFT JOIN chat_room_member partner_membership
              ON partner_membership.chat_room_id = room.id
             AND partner_membership.member_id <> :memberId
            LEFT JOIN member partner
              ON partner.id = partner_membership.member_id
            LEFT JOIN trade
              ON trade.id = room.trade_id
            WHERE room.id = :roomId
            ORDER BY partner_membership.id ASC
            FETCH FIRST 1 ROW ONLY
            """, nativeQuery = true)
    Optional<ChatRoomUpdateProjection> findRoomUpdate(final Long memberId, final Long roomId);
}

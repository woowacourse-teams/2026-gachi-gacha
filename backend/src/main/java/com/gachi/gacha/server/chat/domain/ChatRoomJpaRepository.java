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
}

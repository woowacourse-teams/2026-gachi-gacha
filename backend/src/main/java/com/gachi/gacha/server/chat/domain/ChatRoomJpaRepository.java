package com.gachi.gacha.server.chat.domain;

import com.gachi.gacha.server.chat.domain.exception.ChatRoomNotFoundException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import jakarta.persistence.LockModeType;
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
}

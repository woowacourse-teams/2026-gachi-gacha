package com.gachi.gacha.server.chat.domain;

import com.gachi.gacha.server.chat.domain.exception.ChatRoomNotFoundException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatRoomJpaRepository extends JpaRepository<ChatRoom, Long> {

    default ChatRoom getById(@NonNull final Long roomId) {
        return findById(roomId)
                .orElseThrow(() -> new ChatRoomNotFoundException(ErrorCode.CHAT_ROOM_NOT_FOUND));
    }
}

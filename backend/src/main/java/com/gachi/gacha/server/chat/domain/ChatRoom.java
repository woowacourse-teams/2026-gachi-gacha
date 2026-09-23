package com.gachi.gacha.server.chat.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "chat_room"
)
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ChatRoom extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tradeId;

    @Column(nullable = false)
    private Long lastMessageSequence = 0L;
    private String lastMessagePreview;
    private LocalDateTime lastMessageAt;

    public static ChatRoom create(final Long tradeId) {
        return new ChatRoom(
                null,
                tradeId,
                0L,
                null,
                null
        );
    }

    public long appendMessage(final String preview, final LocalDateTime sentAt) {
        lastMessageSequence++;
        lastMessagePreview = preview;
        lastMessageAt = sentAt;
        return lastMessageSequence;
    }
}

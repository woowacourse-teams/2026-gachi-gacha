package com.gachi.gacha.server.chat.domain;

import com.gachi.gacha.server.common.domain.MongoBaseTimeDocument;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Document("chat_message")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@CompoundIndex(
        name = "uk_chat_message_room_sequence",
        def = "{'roomId': 1, 'sequence': 1}",
        unique = true
)
public class ChatMessage extends MongoBaseTimeDocument {
    @Id
    private String id;

    private Long senderId;
    private Long roomId;
    private MessageType type;
    private String content;
    private List<MessageFile> files;
    private Long sequence;

    @Builder
    public ChatMessage(
            String id,
            Long senderId,
            Long roomId,
            MessageType type,
            String content,
            List<MessageFile> files,
            Long sequence
    ) {
        this.id = id;
        this.senderId = senderId;
        this.roomId = roomId;
        this.type = type;
        this.content = content;
        this.files = files;
        this.sequence = sequence;
    }


    @Getter
    @Builder
    public static class MessageFile {
        private String mediaUrl;
        private String fileName;
        private Long fileSize;
    }
}

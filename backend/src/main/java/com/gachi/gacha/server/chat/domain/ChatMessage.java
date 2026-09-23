package com.gachi.gacha.server.chat.domain;

import com.gachi.gacha.server.chat.domain.exception.InvalidChatMessageException;
import com.gachi.gacha.server.common.domain.BaseTimeDocument;
import com.gachi.gacha.server.common.exception.ErrorCode;
import java.util.List;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;
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
public class ChatMessage extends BaseTimeDocument {

    private static final Set<MessageType> SENDABLE_TYPES =
            Set.of(MessageType.TEXT, MessageType.IMAGE, MessageType.FILE);
    private static final int MAX_CONTENT_LENGTH = 1000;
    private static final int MAX_FILE_COUNT = 10;
    private static final int MAX_PREVIEW_LENGTH = 100;
    private static final String IMAGE_PREVIEW = "사진";
    private static final String FILE_PREVIEW = "파일";

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
        private String contentType;
        private Long fileSize;
    }

    public static ChatMessage create(
            final Long roomId,
            final Long senderId,
            final Long sequence,
            final MessageType type,
            @Nullable final String content,
            @Nullable final List<MessageFile> files
    ) {
        validate(type, content, files);
        return ChatMessage.builder()
                .roomId(roomId)
                .senderId(senderId)
                .sequence(sequence)
                .type(type)
                .content(content)
                .files((files == null) ? List.of() : files)
                .build();
    }

    public static void validate(
            @Nullable final MessageType type,
            @Nullable final String content,
            @Nullable final List<MessageFile> files
    ) {
        List<MessageFile> messageFiles = (files == null) ? List.of() : files;
        if (type == null || !SENDABLE_TYPES.contains(type)) {
            throw new InvalidChatMessageException(ErrorCode.INVALID_CHAT_MESSAGE);
        }
        if (content != null && content.length() > MAX_CONTENT_LENGTH) {
            throw new InvalidChatMessageException(ErrorCode.INVALID_CHAT_MESSAGE);
        }
        if (messageFiles.size() > MAX_FILE_COUNT) {
            throw new InvalidChatMessageException(ErrorCode.INVALID_CHAT_MESSAGE);
        }
        if (type == MessageType.TEXT) {
            validateTextMessage(content, messageFiles);
            return;
        }
        if (messageFiles.isEmpty()) {
            throw new InvalidChatMessageException(ErrorCode.INVALID_CHAT_MESSAGE);
        }
    }

    public static String preview(final MessageType type, @Nullable final String content) {
        if (hasText(content)) {
            return truncate(content);
        }
        if (type == MessageType.IMAGE) {
            return IMAGE_PREVIEW;
        }
        return FILE_PREVIEW;
    }

    private static void validateTextMessage(@Nullable final String content, final List<MessageFile> files) {
        if (!hasText(content) || !files.isEmpty()) {
            throw new InvalidChatMessageException(ErrorCode.INVALID_CHAT_MESSAGE);
        }
    }

    private static boolean hasText(@Nullable final String content) {
        return content != null && !content.isBlank();
    }

    private static String truncate(final String content) {
        if (content.length() <= MAX_PREVIEW_LENGTH) {
            return content;
        }
        return content.substring(0, MAX_PREVIEW_LENGTH);
    }
}

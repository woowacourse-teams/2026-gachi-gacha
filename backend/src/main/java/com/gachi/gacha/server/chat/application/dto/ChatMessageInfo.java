package com.gachi.gacha.server.chat.application.dto;

import com.gachi.gacha.server.chat.domain.ChatMessage;
import com.gachi.gacha.server.chat.domain.MessageType;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record ChatMessageInfo(
        String messageId,
        Long sequence,
        Long roomId,
        Long senderId,
        MessageType type,
        @Nullable String content,
        List<MessageFileInfo> files,
        LocalDateTime createdAt
) {

    public static ChatMessageInfo from(final ChatMessage message) {
        return ChatMessageInfo.builder()
                .messageId(message.getId())
                .sequence(message.getSequence())
                .roomId(message.getRoomId())
                .senderId(message.getSenderId())
                .type(message.getType())
                .content(message.getContent())
                .files(toFileInfos(message.getFiles()))
                .createdAt(message.getCreatedAt())
                .build();
    }

    private static List<MessageFileInfo> toFileInfos(final List<ChatMessage.MessageFile> files) {
        if (files == null) {
            return List.of();
        }
        return files.stream()
                .map(MessageFileInfo::from)
                .toList();
    }

    @Builder
    public record MessageFileInfo(
            String url,
            String originalName,
            @Nullable String contentType,
            Long size
    ) {

        private static MessageFileInfo from(final ChatMessage.MessageFile file) {
            return MessageFileInfo.builder()
                    .url(file.getMediaUrl())
                    .originalName(file.getFileName())
                    .contentType(file.getContentType())
                    .size(file.getFileSize())
                    .build();
        }
    }
}

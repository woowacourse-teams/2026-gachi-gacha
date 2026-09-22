package com.gachi.gacha.server.chat.presentation.dto;

import com.gachi.gacha.server.chat.application.dto.ChatMessageInfo;
import com.gachi.gacha.server.chat.domain.MessageType;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record ChatMessageResponse(
        String messageId,
        Long sequence,
        Long roomId,
        Long senderId,
        MessageType type,
        @Nullable String content,
        List<MessageFileResponse> files,
        LocalDateTime createdAt
) {

    public static ChatMessageResponse from(final ChatMessageInfo info) {
        return ChatMessageResponse.builder()
                .messageId(info.messageId())
                .sequence(info.sequence())
                .roomId(info.roomId())
                .senderId(info.senderId())
                .type(info.type())
                .content(info.content())
                .files(info.files().stream()
                        .map(MessageFileResponse::from)
                        .toList())
                .createdAt(info.createdAt())
                .build();
    }

    @Builder
    public record MessageFileResponse(
            String url,
            String originalName,
            @Nullable String contentType,
            Long size
    ) {

        private static MessageFileResponse from(final ChatMessageInfo.MessageFileInfo info) {
            return MessageFileResponse.builder()
                    .url(info.url())
                    .originalName(info.originalName())
                    .contentType(info.contentType())
                    .size(info.size())
                    .build();
        }
    }
}

package com.gachi.gacha.server.chat.application.dto;

import com.gachi.gacha.server.chat.domain.ChatMessage;
import com.gachi.gacha.server.chat.domain.MessageType;
import java.util.List;
import org.jspecify.annotations.Nullable;

public record ChatMessageSendCommand(
        MessageType type,
        @Nullable String content,
        List<FileCommand> files
) {

    public ChatMessageSendCommand {
        files = (files == null) ? List.of() : List.copyOf(files);
    }

    public List<ChatMessage.MessageFile> toMessageFiles() {
        return files.stream()
                .map(FileCommand::toMessageFile)
                .toList();
    }

    public record FileCommand(
            String url,
            String originalName,
            @Nullable String contentType,
            Long size
    ) {

        private ChatMessage.MessageFile toMessageFile() {
            return ChatMessage.MessageFile.builder()
                    .mediaUrl(url)
                    .fileName(originalName)
                    .contentType(contentType)
                    .fileSize(size)
                    .build();
        }
    }
}

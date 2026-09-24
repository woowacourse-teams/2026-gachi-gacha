package com.gachi.gacha.server.chat.presentation.dto;

import com.gachi.gacha.server.chat.application.dto.ChatMessageSendCommand;
import com.gachi.gacha.server.chat.domain.MessageType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.jspecify.annotations.Nullable;

public record ChatMessageSendRequest(
        @NotNull MessageType type,
        @Nullable String content,
        @Valid List<FileRequest> files
) {

    public ChatMessageSendCommand toCommand() {
        return new ChatMessageSendCommand(
                type,
                content,
                (files == null) ? List.of() : files.stream().map(FileRequest::toCommand).toList()
        );
    }

    public record FileRequest(
            @NotBlank String url,
            @NotBlank String originalName,
            @Nullable String contentType,
            @NotNull Long size
    ) {

        private ChatMessageSendCommand.FileCommand toCommand() {
            return new ChatMessageSendCommand.FileCommand(url, originalName, contentType, size);
        }
    }
}

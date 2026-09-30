package com.gachi.gacha.server.chat.presentation.dto;

import com.gachi.gacha.server.chat.application.dto.ChatMessageSendCommand;
import com.gachi.gacha.server.chat.domain.MessageType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.jspecify.annotations.Nullable;

@Schema(
        description = """
                채팅 메시지 발송 요청.

                STOMP(`/app/chat/rooms/{roomId}/messages`) 로만 사용하므로 REST 문서에는 나타나지 않는다.
                구조를 코드 가까이에 남겨두기 위해 기술해 둔다."""
)
public record ChatMessageSendRequest(
        @Schema(description = "메시지 종류", example = "TEXT", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull MessageType type,

        @Schema(description = "메시지 본문. 파일만 보내는 경우 생략한다.", example = "오늘 교환 가능할까요?")
        @Nullable String content,

        @Schema(description = "첨부 파일. POST /files 로 업로드한 결과를 담는다.")
        @Valid List<FileRequest> files
) {

    public ChatMessageSendCommand toCommand() {
        return new ChatMessageSendCommand(
                type,
                content,
                (files == null) ? List.of() : files.stream().map(FileRequest::toCommand).toList()
        );
    }

    @Schema(description = "채팅 첨부 파일")
    public record FileRequest(
            @Schema(description = "업로드된 파일 URL", requiredMode = Schema.RequiredMode.REQUIRED)
            @NotBlank String url,

            @Schema(description = "원본 파일명", example = "kuromi.jpg", requiredMode = Schema.RequiredMode.REQUIRED)
            @NotBlank String originalName,

            @Schema(description = "MIME 타입", example = "image/jpeg")
            @Nullable String contentType,

            @Schema(description = "파일 크기(바이트)", example = "204800", requiredMode = Schema.RequiredMode.REQUIRED)
            @NotNull Long size
    ) {

        private ChatMessageSendCommand.FileCommand toCommand() {
            return new ChatMessageSendCommand.FileCommand(url, originalName, contentType, size);
        }
    }
}

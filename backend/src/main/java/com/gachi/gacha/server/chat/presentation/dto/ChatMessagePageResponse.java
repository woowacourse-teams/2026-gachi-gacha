package com.gachi.gacha.server.chat.presentation.dto;

import com.gachi.gacha.server.chat.application.dto.ChatMessagePageInfo;
import java.util.List;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record ChatMessagePageResponse(
        List<ChatMessageResponse> messages,
        @Nullable Long nextLastSequence,
        boolean hasNext
) {

    public static ChatMessagePageResponse from(final ChatMessagePageInfo info) {
        return ChatMessagePageResponse.builder()
                .messages(info.messages().stream()
                        .map(ChatMessageResponse::from)
                        .toList())
                .nextLastSequence(info.nextLastSequence())
                .hasNext(info.hasNext())
                .build();
    }
}

package com.gachi.gacha.server.chat.application.dto;

import com.gachi.gacha.server.chat.domain.ChatMessage;
import java.util.List;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record ChatMessagePageInfo(
        List<ChatMessageInfo> messages,
        @Nullable Long nextLastSequence,
        boolean hasNext
) {

    public static ChatMessagePageInfo of(
            final List<ChatMessage> queriedMessages,
            final int pageSize
    ) {
        boolean hasNext = queriedMessages.size() > pageSize;
        List<ChatMessageInfo> messages = queriedMessages.stream()
                .limit(pageSize)
                .map(ChatMessageInfo::from)
                .toList();
        Long nextLastSequence = messages.isEmpty()
                ? null
                : messages.getLast().sequence();

        return ChatMessagePageInfo.builder()
                .messages(messages)
                .nextLastSequence(nextLastSequence)
                .hasNext(hasNext)
                .build();
    }
}

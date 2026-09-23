package com.gachi.gacha.server.chat.presentation;

import com.gachi.gacha.server.chat.application.ChatMessageService;
import com.gachi.gacha.server.chat.application.dto.ChatMessagePageInfo;
import com.gachi.gacha.server.chat.presentation.dto.ChatMessagePageResponse;
import com.gachi.gacha.server.chat.presentation.dto.ChatMessageReadRequest;
import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat/rooms/{roomId}/messages")
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    @GetMapping
    public BaseResponse<ChatMessagePageResponse> getMessages(
            @Auth final Long memberId,
            @PathVariable final Long roomId,
            @RequestParam(required = false) final Long lastSequence,
            @RequestParam(defaultValue = "20") final int pageSize
    ) {
        ChatMessagePageInfo chatMessagePageInfo = chatMessageService.getMessages(
                memberId,
                roomId,
                lastSequence,
                pageSize
        );
        return BaseResponse.ok(ChatMessagePageResponse.from(chatMessagePageInfo));
    }

    @PatchMapping("/read")
    public BaseResponse<Void> readMessages(
            @Auth final Long memberId,
            @PathVariable final Long roomId,
            @Valid @RequestBody final ChatMessageReadRequest request
    ) {
        chatMessageService.checkReadMessage(
                memberId,
                roomId,
                request.lastReadSequence()
        );

        return BaseResponse.updated(null);
    }
}

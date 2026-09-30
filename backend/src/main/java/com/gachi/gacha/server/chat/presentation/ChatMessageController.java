package com.gachi.gacha.server.chat.presentation;

import com.gachi.gacha.server.chat.application.ChatMessageService;
import com.gachi.gacha.server.chat.application.dto.ChatMessagePageInfo;
import com.gachi.gacha.server.chat.presentation.dto.ChatMessagePageResponse;
import com.gachi.gacha.server.chat.presentation.dto.ChatMessageReadRequest;
import com.gachi.gacha.server.chat.presentation.websocket.ChatRoomUpdateSender;
import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.config.OpenApiConfig;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "채팅 메시지", description = "메시지 조회와 읽음 처리. 발송은 STOMP 를 사용해 이 문서에 없다.")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
@RestController
@RequiredArgsConstructor
@RequestMapping("/chat/rooms/{roomId}/messages")
public class ChatMessageController {

    private final ChatMessageService chatMessageService;
    private final ChatRoomUpdateSender chatRoomUpdateSender;

    @Operation(
            summary = "메시지 목록 조회",
            description = """
                    최신 메시지부터 pageSize 개를 반환한다.

                    다음 페이지는 응답에서 가장 오래된 메시지의 sequence 를 lastSequence 로 보내 이어받는다(커서 방식)."""
    )
    @GetMapping
    public BaseResponse<ChatMessagePageResponse> getMessages(
            @Auth final Long memberId,
            @Parameter(description = "채팅방 ID", example = "1") @PathVariable final Long roomId,
            @Parameter(description = "이 sequence 보다 이전 메시지를 가져온다. 첫 페이지는 생략한다.", example = "100")
            @RequestParam(required = false) final Long lastSequence,
            @Parameter(description = "한 번에 가져올 개수", example = "20")
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

    @Operation(
            summary = "읽음 처리",
            description = """
                    lastReadSequence 까지 읽은 것으로 표시한다.

                    이미 읽은 지점보다 과거 값을 보내면 읽음 상태가 후퇴하지 않고 무시된다.
                    방의 마지막 sequence 를 넘는 값은 `CHE006` 으로 거부한다."""
    )
    @PatchMapping("/read")
    public BaseResponse<Void> readMessages(
            @Auth final Long memberId,
            @Parameter(description = "채팅방 ID", example = "1") @PathVariable final Long roomId,
            @Valid @RequestBody final ChatMessageReadRequest request
    ) {
        chatMessageService.checkReadMessage(
                memberId,
                roomId,
                request.lastReadSequence()
        );

        chatRoomUpdateSender.sendToMember(memberId, roomId);
        return BaseResponse.updated(null);
    }
}

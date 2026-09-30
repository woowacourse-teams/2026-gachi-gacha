package com.gachi.gacha.server.chat.presentation;

import com.gachi.gacha.server.chat.application.ChatRoomService;
import com.gachi.gacha.server.chat.application.dto.ChatRoomCreateInfo;
import com.gachi.gacha.server.chat.application.dto.ChatRoomExistenceInfo;
import com.gachi.gacha.server.chat.application.dto.ChatRoomInfo;
import com.gachi.gacha.server.chat.presentation.dto.ChatRoomCreateRequest;
import com.gachi.gacha.server.chat.presentation.dto.ChatRoomCreateResponse;
import com.gachi.gacha.server.chat.presentation.dto.ChatRoomExistenceResponse;
import com.gachi.gacha.server.chat.presentation.dto.ChatRoomListResponse;
import com.gachi.gacha.server.chat.presentation.dto.ChatRoomResponse;
import com.gachi.gacha.server.chat.presentation.dto.ChatUnreadCountResponse;
import com.gachi.gacha.server.chat.presentation.websocket.ChatRoomUpdateSender;
import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.config.OpenApiConfig;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Tag(name = "채팅방", description = "채팅방 생성·조회. 실시간 메시지 송수신은 STOMP 를 사용해 이 문서에 없다.")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
@RestController
@RequiredArgsConstructor
@RequestMapping("/chat/rooms")
public class ChatRoomController {

    private final ChatRoomService chatRoomService;
    private final ChatRoomUpdateSender chatRoomUpdateSender;

    @Operation(
            summary = "내 채팅방 목록 조회",
            description = "참여 중인 채팅방을 마지막 메시지와 안 읽은 수와 함께 반환한다."
    )
    @GetMapping("/me")
    public BaseResponse<ChatRoomListResponse> getRooms(@Auth final Long memberId) {
        List<ChatRoomInfo> chatRoomInfos = chatRoomService.getRooms(memberId);
        return BaseResponse.ok(ChatRoomListResponse.from(chatRoomInfos));
    }

    @Operation(
            summary = "채팅방 존재 여부 확인",
            description = """
                    해당 교환 게시글로 내가 이미 만든 채팅방이 있는지 확인한다.

                    게시글 상세에서 '채팅하기' 를 누르기 전에 호출해, 새로 만들지 기존 방으로 들어갈지 판단한다."""
    )
    @GetMapping("/existence")
    public BaseResponse<ChatRoomExistenceResponse> findRoomExistence(
            @Auth final Long memberId,
            @Parameter(description = "교환 게시글 ID", example = "1") @RequestParam final Long tradeId
    ) {
        ChatRoomExistenceInfo chatRoomExistenceInfo = chatRoomService.findRoomExistence(memberId, tradeId);
        return BaseResponse.ok(ChatRoomExistenceResponse.from(chatRoomExistenceInfo));
    }

    @Operation(summary = "채팅방 상세 조회", description = "참여자가 아니면 `CHE005` 로 거부한다.")
    @GetMapping("/{roomId}")
    public BaseResponse<ChatRoomResponse> readRoom(
            @Auth final Long memberId,
            @Parameter(description = "채팅방 ID", example = "1") @PathVariable final Long roomId
    ) {
        ChatRoomInfo chatRoomInfo = chatRoomService.getRoom(memberId, roomId);
        return BaseResponse.ok(ChatRoomResponse.from(chatRoomInfo));
    }

    @Operation(
            summary = "채팅방 생성",
            description = """
                    교환 게시글 작성자와의 채팅방을 만든다.

                    본인 게시글에는 만들 수 없고(`CHE002`), 이미 만든 방이 있으면 `CHE003` 으로 거부한다."""
    )
    @PostMapping
    public ResponseEntity<BaseResponse<ChatRoomCreateResponse>> createRoom(
            @Auth final Long memberId,
            @Valid @RequestBody final ChatRoomCreateRequest request
    ) {
        ChatRoomCreateInfo chatRoomCreateInfo = chatRoomService.createRoom(memberId, request.tradeId());
        ChatRoomCreateResponse response = ChatRoomCreateResponse.of(chatRoomCreateInfo);
        
        chatRoomUpdateSender.sendToRoomMembers(response.roomId());
        return BaseResponse.created(
                ServletUriComponentsBuilder
                        .fromCurrentRequest()
                        .path("/{roomId}")
                        .buildAndExpand(response.roomId())
                        .toUri(),
                response
        );
    }

    @Operation(
            summary = "전체 안 읽은 메시지 수 조회",
            description = "참여 중인 모든 채팅방의 안 읽은 메시지를 합산한다. 하단 탭 배지에 쓴다."
    )
    @GetMapping("/unread-count")
    public BaseResponse<ChatUnreadCountResponse> getUnreadCount(@Auth final Long memberId) {
        ChatUnreadCountResponse response = ChatUnreadCountResponse.from(chatRoomService.getUnreadCount(memberId));
        return BaseResponse.ok(response);
    }
}

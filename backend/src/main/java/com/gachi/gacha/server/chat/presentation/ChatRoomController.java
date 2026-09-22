package com.gachi.gacha.server.chat.presentation;

import com.gachi.gacha.server.chat.application.ChatRoomService;
import com.gachi.gacha.server.chat.application.dto.ChatRoomCreateInfo;
import com.gachi.gacha.server.chat.application.dto.ChatRoomExistenceInfo;
import com.gachi.gacha.server.chat.application.dto.ChatRoomInfo;
import com.gachi.gacha.server.chat.presentation.dto.ChatRoomCreateRequest;
import com.gachi.gacha.server.chat.presentation.dto.ChatRoomCreateResponse;
import com.gachi.gacha.server.chat.presentation.dto.ChatRoomExistenceResponse;
import com.gachi.gacha.server.chat.presentation.dto.ChatRoomListResponse;
import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat/rooms")
public class ChatRoomController {

    private final ChatRoomService chatRoomService;

    @GetMapping("/me")
    public BaseResponse<ChatRoomListResponse> getRooms(@Auth final Long memberId) {
        List<ChatRoomInfo> chatRoomInfos = chatRoomService.getRooms(memberId);
        return BaseResponse.ok(ChatRoomListResponse.from(chatRoomInfos));
    }

    @GetMapping("/existence")
    public BaseResponse<ChatRoomExistenceResponse> findRoomExistence(
            @Auth final Long memberId,
            @RequestParam final Long tradeId
    ) {
        ChatRoomExistenceInfo chatRoomExistenceInfo = chatRoomService.findRoomExistence(memberId, tradeId);
        return BaseResponse.ok(ChatRoomExistenceResponse.from(chatRoomExistenceInfo));
    }

    @PostMapping
    public ResponseEntity<BaseResponse<ChatRoomCreateResponse>> createRoom(
            @Auth final Long memberId,
            @Valid @RequestBody final ChatRoomCreateRequest request
    ) {
        ChatRoomCreateInfo chatRoomCreateInfo = chatRoomService.createRoom(memberId, request.tradeId());
        ChatRoomCreateResponse response = ChatRoomCreateResponse.of(chatRoomCreateInfo);
        return BaseResponse.created(
                ServletUriComponentsBuilder
                        .fromCurrentRequest()
                        .path("/{roomId}")
                        .buildAndExpand(response.roomId())
                        .toUri(),
                response
        );
    }
}

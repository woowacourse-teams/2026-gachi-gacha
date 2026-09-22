package com.gachi.gacha.server.chat.presentation;

import com.gachi.gacha.server.chat.application.ChatRoomService;
import com.gachi.gacha.server.chat.application.dto.ChatRoomInfo;
import com.gachi.gacha.server.chat.presentation.dto.ChatRoomListResponse;
import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat/rooms")
public class ChatRoomController {

    private final ChatRoomService chatRoomService;

    @GetMapping
    public BaseResponse<ChatRoomListResponse> getRooms(@Auth final Long memberId) {
        List<ChatRoomInfo> chatRoomInfos = chatRoomService.getRooms(memberId);
        return BaseResponse.ok(ChatRoomListResponse.from(chatRoomInfos));
    }
}

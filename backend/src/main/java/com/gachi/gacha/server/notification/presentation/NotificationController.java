package com.gachi.gacha.server.notification.presentation;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.config.SwaggerConfig;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.notification.application.NotificationService;
import com.gachi.gacha.server.notification.application.dto.NotificationPageInfo;
import com.gachi.gacha.server.notification.presentation.dto.NotificationPageResponse;
import com.gachi.gacha.server.notification.presentation.dto.NotificationUnreadCountResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "알림", description = "알림 목록·안 읽은 수 조회와 읽음 처리. 댓글 알림만 담고 채팅은 포함하지 않는다.")
@SecurityRequirement(name = SwaggerConfig.BEARER_AUTH)
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "알림 목록 조회", description = "최신 알림부터 반환한다.")
    @GetMapping
    public BaseResponse<NotificationPageResponse> getNotifications(
            @Auth final Long memberId,
            @Parameter(description = "이 알림 ID 보다 이전 알림을 가져온다. 첫 페이지는 생략한다.", example = "101")
            @RequestParam(required = false) final Long lastNotificationId,
            @Parameter(description = "한 번에 가져올 개수 (최대 100)", example = "20")
            @RequestParam(defaultValue = "20") final int pageSize
    ) {
        NotificationPageInfo notificationPageInfo = notificationService.getNotifications(
                memberId,
                lastNotificationId,
                pageSize
        );
        return BaseResponse.ok(NotificationPageResponse.from(notificationPageInfo));
    }

    @Operation(summary = "안 읽은 알림 수 조회")
    @GetMapping("/unread-count")
    public BaseResponse<NotificationUnreadCountResponse> getUnreadCount(@Auth final Long memberId) {
        long unreadCount = notificationService.getUnreadCount(memberId);
        return BaseResponse.ok(NotificationUnreadCountResponse.from(unreadCount));
    }

    @Operation(summary = "알림 읽음 처리", description = "이미 읽은 알림도 성공으로 처리한다.")
    @PatchMapping("/{notificationId}/read")
    public BaseResponse<Void> readNotification(
            @Auth final Long memberId,
            @Parameter(description = "알림 ID", example = "101") @PathVariable final Long notificationId
    ) {
        notificationService.read(memberId, notificationId);
        return BaseResponse.updated(null);
    }

    @Operation(summary = "알림 모두 읽음 처리")
    @PatchMapping("/read-all")
    public BaseResponse<Void> readAllNotifications(@Auth final Long memberId) {
        notificationService.readAll(memberId);
        return BaseResponse.updated(null);
    }
}

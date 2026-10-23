package com.gachi.gacha.server.notification.application.dto;

import com.gachi.gacha.server.notification.domain.PushPlatform;

public record PushTokenRegisterCommand(
        String token,
        PushPlatform platform
) {
}

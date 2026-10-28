package com.gachi.gacha.server.member.infra.apple.util;

import com.gachi.gacha.server.member.infra.apple.dto.AppleUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppleUserNameExtractor {

    private final ObjectMapper objectMapper;

    public String extract(final String userJson) {
        if (userJson == null || userJson.isBlank()) {
            return null;
        }
        try {
            AppleUser user = objectMapper.readValue(userJson, AppleUser.class);
            return user.name() == null ? null : user.name().toDisplayName();
        } catch (Exception e) {
            log.warn("Apple user 파싱 실패, 닉네임 자동 생성으로 대체");
            return null;
        }
    }
}

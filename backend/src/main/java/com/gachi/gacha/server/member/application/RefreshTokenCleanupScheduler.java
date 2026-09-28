package com.gachi.gacha.server.member.application;

import com.gachi.gacha.server.member.domain.auth.token.RefreshTokenJpaRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class RefreshTokenCleanupScheduler {

    private static final int RETENTION_DAYS = 7;

    private final RefreshTokenJpaRepository refreshTokenJpaRepository;

    @Scheduled(cron = "${jwt.refresh-cleanup.cron:0 0 4 * * *}", zone = "Asia/Seoul")
    @Transactional
    public void cleanup() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(RETENTION_DAYS);
        int deleted = refreshTokenJpaRepository.deleteAllExpiredBefore(threshold);
        log.info("만료된 refresh token 정리 완료: {}건 삭제 (기준: {} 이전 만료)", deleted, threshold);
    }
}

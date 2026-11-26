package com.gachi.gacha.server.news.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 승인 표 하나. (회차, 슬랙 회원) 이 유일해서 같은 사람이 두 번 눌러도 1표다.
 * 표는 회차 안에서만 유효하고, 회차가 만료돼도 새 회차로 옮기지 않는다.
 */
@Getter
@Entity
@Table(name = "news_approval")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NewsApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long batchId;

    @Column(nullable = false, length = 30)
    private String slackUserId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public NewsApproval(final Long batchId, final String slackUserId) {
        this.batchId = Objects.requireNonNull(batchId, "batchId");
        this.slackUserId = Objects.requireNonNull(slackUserId, "slackUserId");
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

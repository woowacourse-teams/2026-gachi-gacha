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
 * 사람이 [제외]를 누른 링크. 이 링크의 소식은 공개도 푸시도 하지 않고, 다음 수집에서 다시 올라오지도 않는다.
 * [되돌리기]를 누르면 이 행을 지운다. [다시 수집]으로 버린 묶음은 사람이 제외한 것이 아니라서 기록하지 않는다.
 */
@Getter
@Entity
@Table(name = "news_exclusion")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NewsExclusion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String topic;

    @Column(nullable = false)
    private String linkKey;

    @Column(nullable = false, length = 30)
    private String slackUserId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public NewsExclusion(final String topic, final String linkKey, final String slackUserId) {
        this.topic = Objects.requireNonNull(topic, "topic");
        this.linkKey = Objects.requireNonNull(linkKey, "linkKey");
        this.slackUserId = Objects.requireNonNull(slackUserId, "slackUserId");
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

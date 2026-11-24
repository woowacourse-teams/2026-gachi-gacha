package com.gachi.gacha.server.news.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 공개 소식. 모든 회원이 함께 읽는다. 내용은 수집 후보를 그대로 가리키고, 회원별로 복사하지 않는다.
 *
 * <p>{@code publishedAt} 은 목록에 공개하는 시각이다. 승인할 때 정해 두면 그 시각이 지나는 순간 목록에 보인다.
 */
@Getter
@Entity
@Table(name = "news_item")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NewsItem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String topic;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_id", nullable = false, unique = true)
    private NewsCandidate candidate;

    @Column(nullable = false)
    private String linkKey;

    @Column(nullable = false)
    private LocalDateTime publishedAt;

    private NewsItem(final String topic, final NewsCandidate candidate, final LocalDateTime publishedAt) {
        this.topic = Objects.requireNonNull(topic, "topic");
        this.candidate = Objects.requireNonNull(candidate, "candidate");
        this.linkKey = candidate.linkKey();
        this.publishedAt = Objects.requireNonNull(publishedAt, "publishedAt");
    }

    /**
     * 발송이 미뤄지면 목록 공개 시각도 같이 미룬다. 목록과 푸시는 같은 시각에 나가야 한다.
     */
    public void reschedule(final LocalDateTime newPublishedAt) {
        this.publishedAt = Objects.requireNonNull(newPublishedAt, "newPublishedAt");
    }

    /**
     * 링크가 검증된 공개 대상만 공개 소식이 될 수 있다. 확인 필요나 지난 소식은 공개하지 않는다.
     */
    public static NewsItem publish(final String topic, final NewsCandidate candidate, final LocalDateTime publishedAt) {
        if (!candidate.getReview().isPublishable() || candidate.linkKey().isEmpty()) {
            throw new IllegalArgumentException("공개할 수 없는 후보: " + candidate.getReview() + " " + candidate.getTitle());
        }
        return new NewsItem(topic, candidate, publishedAt);
    }
}

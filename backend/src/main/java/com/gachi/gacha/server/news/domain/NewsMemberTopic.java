package com.gachi.gacha.server.news.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 회원이 한 주제에 대해 가진 설정: 구독 여부와 탭을 마지막으로 본 시각. 기본값은 구독하지 않음이다.
 *
 * <p>구독을 꺼도 행을 지우지 않는다. "신상 알림을 끈 비율"을 잴 수 있도록 끈 시각이 남는다.
 */
@Getter
@Entity
@Table(name = "news_member_topic")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NewsMemberTopic extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false, length = 30)
    private String topic;

    @Column(nullable = false)
    private boolean subscribed;

    private LocalDateTime subscribedAt;

    private LocalDateTime unsubscribedAt;

    private LocalDateTime lastViewedAt;

    public static NewsMemberTopic of(final Long memberId, final String topic) {
        NewsMemberTopic memberTopic = new NewsMemberTopic();
        memberTopic.memberId = Objects.requireNonNull(memberId, "memberId");
        memberTopic.topic = Objects.requireNonNull(topic, "topic");
        return memberTopic;
    }

    /**
     * 이미 구독 중이면 구독한 시각을 바꾸지 않는다.
     */
    public void subscribe(final LocalDateTime now) {
        if (subscribed) {
            return;
        }
        this.subscribed = true;
        this.subscribedAt = Objects.requireNonNull(now, "now");
    }

    /**
     * 구독 중이 아니면 아무것도 하지 않는다. 끈 시각은 가장 최근 값으로 남고, 다시 켜도 지우지 않는다.
     */
    public void unsubscribe(final LocalDateTime now) {
        if (!subscribed) {
            return;
        }
        this.subscribed = false;
        this.unsubscribedAt = Objects.requireNonNull(now, "now");
    }

    public void view(final LocalDateTime now) {
        this.lastViewedAt = Objects.requireNonNull(now, "now");
    }
}

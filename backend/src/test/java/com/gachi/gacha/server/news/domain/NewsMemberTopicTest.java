package com.gachi.gacha.server.news.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class NewsMemberTopicTest {

    private static final LocalDateTime T1 = LocalDateTime.of(2026, 11, 10, 9, 0);
    private static final LocalDateTime T2 = LocalDateTime.of(2026, 11, 11, 9, 0);
    private static final LocalDateTime T3 = LocalDateTime.of(2026, 11, 12, 9, 0);

    @Test
    @DisplayName("처음에는 구독하지 않은 상태이고 아무 시각도 없다")
    void startsUnsubscribed() {
        NewsMemberTopic topic = NewsMemberTopic.of(1L, "CHIIKAWA");

        assertThat(topic.isSubscribed()).isFalse();
        assertThat(topic.getSubscribedAt()).isNull();
        assertThat(topic.getUnsubscribedAt()).isNull();
        assertThat(topic.getLastViewedAt()).isNull();
    }

    @Test
    @DisplayName("구독하면 구독 시각이 남고, 이미 구독 중이면 시각을 바꾸지 않는다")
    void subscribeIsIdempotent() {
        NewsMemberTopic topic = NewsMemberTopic.of(1L, "CHIIKAWA");

        topic.subscribe(T1);
        topic.subscribe(T2);

        assertThat(topic.isSubscribed()).isTrue();
        assertThat(topic.getSubscribedAt()).isEqualTo(T1);
    }

    @Test
    @DisplayName("구독을 끄면 끈 시각이 남고, 구독 중이 아니면 아무것도 바꾸지 않는다")
    void unsubscribeKeepsRecord() {
        NewsMemberTopic neverSubscribed = NewsMemberTopic.of(1L, "CHIIKAWA");
        NewsMemberTopic topic = NewsMemberTopic.of(2L, "CHIIKAWA");
        topic.subscribe(T1);

        neverSubscribed.unsubscribe(T2);
        topic.unsubscribe(T2);
        topic.unsubscribe(T3);

        assertThat(neverSubscribed.getUnsubscribedAt()).isNull();
        assertThat(topic.isSubscribed()).isFalse();
        assertThat(topic.getSubscribedAt()).isEqualTo(T1);
        assertThat(topic.getUnsubscribedAt()).isEqualTo(T2);
    }

    @Test
    @DisplayName("다시 켜도 끈 기록은 지우지 않고, 가장 최근에 끈 시각으로 남는다")
    void resubscribeKeepsUnsubscribedAt() {
        NewsMemberTopic topic = NewsMemberTopic.of(1L, "CHIIKAWA");
        topic.subscribe(T1);
        topic.unsubscribe(T2);

        topic.subscribe(T3);

        assertThat(topic.isSubscribed()).isTrue();
        assertThat(topic.getSubscribedAt()).isEqualTo(T3);
        assertThat(topic.getUnsubscribedAt()).isEqualTo(T2);
    }

    @Test
    @DisplayName("탭을 본 시각은 구독과 따로 기록한다")
    void viewIsIndependentOfSubscription() {
        NewsMemberTopic topic = NewsMemberTopic.of(1L, "CHIIKAWA");

        topic.view(T1);
        topic.view(T2);

        assertThat(topic.getLastViewedAt()).isEqualTo(T2);
        assertThat(topic.isSubscribed()).isFalse();
    }
}

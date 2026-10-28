package com.gachi.gacha.server.notification.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 알림 목록에 남는 알림 기록.
 *
 * <p>완성된 문구 대신 문구의 재료(작성자 표시 이름, 내용 미리보기)를 저장한다. 문구를 바꿔도 이미 쌓인 알림까지
 * 새 문구로 보여 줄 수 있고, 작성자가 닉네임을 바꿔도 알림이 생긴 시점의 이름이 유지된다.
 */
@Getter
@Entity
@Table(name = "notification")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseTimeEntity {

    private static final int MAX_PREVIEW_LENGTH = 100;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long receiverId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(nullable = false)
    private Long tradeId;

    @Column(nullable = false)
    private Long commentId;

    @Column(nullable = false)
    private String actorName;

    @Column(nullable = false, length = MAX_PREVIEW_LENGTH)
    private String preview;

    @Column(nullable = false)
    private boolean isRead;

    private Notification(
            final Long receiverId,
            final NotificationType type,
            final Long tradeId,
            final Long commentId,
            final String actorName,
            final String preview
    ) {
        this.receiverId = receiverId;
        this.type = type;
        this.tradeId = tradeId;
        this.commentId = commentId;
        this.actorName = actorName;
        this.preview = preview;
        this.isRead = false;
    }

    public static Notification ofComment(
            final Long receiverId,
            final Long tradeId,
            final Long commentId,
            final String actorName,
            final String content
    ) {
        return new Notification(
                receiverId,
                NotificationType.COMMENT,
                tradeId,
                commentId,
                actorName,
                truncate(content)
        );
    }

    public void read() {
        this.isRead = true;
    }

    private static String truncate(final String content) {
        if (content.length() <= MAX_PREVIEW_LENGTH) {
            return content;
        }
        return content.substring(0, MAX_PREVIEW_LENGTH);
    }
}

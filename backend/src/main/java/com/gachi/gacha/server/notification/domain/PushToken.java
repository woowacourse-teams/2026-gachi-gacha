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
 * 회원 기기의 FCM 등록 토큰. 한 회원이 기기를 여러 대 쓰면 여러 행을 가진다.
 *
 * <p>토큰은 기기·앱 설치마다 하나라 유니크하다. 같은 기기에서 다른 계정으로 로그인하면 새 행을 만들지 않고
 * 회원만 바꿔야 이전 계정의 알림이 그 기기로 가지 않는다.
 */
@Getter
@Entity
@Table(name = "push_token")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PushToken extends BaseTimeEntity {

    private static final int MAX_TOKEN_LENGTH = 512;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false, unique = true, length = MAX_TOKEN_LENGTH)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PushPlatform platform;

    private PushToken(final Long memberId, final String token, final PushPlatform platform) {
        this.memberId = memberId;
        this.token = token;
        this.platform = platform;
    }

    public static PushToken of(final Long memberId, final String token, final PushPlatform platform) {
        return new PushToken(memberId, token, platform);
    }

    public void assignTo(final Long memberId) {
        this.memberId = memberId;
    }
}

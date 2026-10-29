package com.gachi.gacha.server.member.domain.auth.nonce;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "mobile_oauth_nonce", indexes = {
        @Index(name = "idx_mobile_oauth_nonce_expires_at", columnList = "expiresAt")
})
public class MobileOauthNonce extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String nonceHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private OauthProviderType provider;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Builder
    private MobileOauthNonce(final String nonceHash, final OauthProviderType provider,
                             final LocalDateTime expiresAt) {
        this.nonceHash = nonceHash;
        this.provider = provider;
        this.expiresAt = expiresAt;
    }
}

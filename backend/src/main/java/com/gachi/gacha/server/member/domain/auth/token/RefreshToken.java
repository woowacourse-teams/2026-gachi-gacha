package com.gachi.gacha.server.member.domain.auth.token;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(
        name = "refresh_token",
        indexes = {
                @Index(name = "idx_refresh_token_member_id", columnList = "memberId"),
                @Index(name = "idx_refresh_token_family_id", columnList = "familyId"),
                @Index(name = "idx_refresh_token_expires_at", columnList = "expiresAt")
        }
)
public class RefreshToken extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false, length = 36)
    private String familyId;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private LocalDateTime revokedAt;

    @Builder
    private RefreshToken(
            final Long memberId,
            final String tokenHash,
            final String familyId,
            final LocalDateTime expiresAt
    ) {
        this.memberId = memberId;
        this.tokenHash = tokenHash;
        this.familyId = familyId;
        this.expiresAt = expiresAt;
    }

    public boolean isExpired(final LocalDateTime now) {
        return !expiresAt.isAfter(now);
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public void revoke(final LocalDateTime now) {
        if (revokedAt == null) {
            this.revokedAt = now;
        }
    }
}

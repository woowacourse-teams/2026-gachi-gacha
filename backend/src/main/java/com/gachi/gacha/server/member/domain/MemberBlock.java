package com.gachi.gacha.server.member.domain;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.exception.SelfBlockNotAllowedException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Entity
@Table(name = "member_block")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long blockerId;

    @Column(nullable = false)
    private Long blockedId;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private MemberBlock(final Long blockerId, final Long blockedId) {
        this.blockerId = blockerId;
        this.blockedId = blockedId;
    }

    public static MemberBlock of(final Long blockerId, final Long blockedId) {
        validateNotSelf(blockerId, blockedId);
        return new MemberBlock(blockerId, blockedId);
    }

    private static void validateNotSelf(final Long blockerId, final Long blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new SelfBlockNotAllowedException(ErrorCode.SELF_BLOCK_NOT_ALLOWED);
        }
    }
}

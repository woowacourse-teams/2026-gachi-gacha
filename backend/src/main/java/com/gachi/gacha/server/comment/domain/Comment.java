package com.gachi.gacha.server.comment.domain;

import com.gachi.gacha.server.comment.domain.exception.InvalidCommentException;
import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.common.exception.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

/**
 * 거래 게시글 댓글.
 *
 * <p>작성자 정보를 연관관계가 아니라 작성 시점의 값으로 복사해 둔다. Member 에 걸린
 * {@code @SQLRestriction("is_deleted = false")} 때문에 탈퇴 회원을 참조하면 조회가 실패하기 때문이다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment extends BaseTimeEntity {

    public static final String DEFAULT_ANONYMOUS_NICKNAME = "루챠";

    private static final int MAX_NICKNAME_LENGTH = 50;
    private static final int MAX_CONTENT_LENGTH = 500;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tradeId;

    private Long memberId;

    @Column(nullable = false, length = MAX_NICKNAME_LENGTH)
    private String nickname;

    @Column(length = 20)
    private String ip;

    @Column(length = 500)
    private String profileImageUrl;

    @Column(nullable = false, length = MAX_CONTENT_LENGTH)
    private String content;

    private Comment(
            final Long tradeId,
            @Nullable final Long memberId,
            final String nickname,
            @Nullable final String ip,
            @Nullable final String profileImageUrl,
            final String content
    ) {
        validateTradeId(tradeId);
        validateNickname(nickname);
        validateContent(content);

        this.tradeId = tradeId;
        this.memberId = memberId;
        this.nickname = nickname;
        this.ip = ip;
        this.profileImageUrl = profileImageUrl;
        this.content = content;
    }

    public static Comment ofMember(
            final Long tradeId,
            final Long memberId,
            final String nickname,
            @Nullable final String profileImageUrl,
            final String content
    ) {
        if (memberId == null) {
            throw new InvalidCommentException(ErrorCode.INVALID_COMMENT_POLICY);
        }
        return new Comment(tradeId, memberId, nickname, null, profileImageUrl, content);
    }

    /**
     * 비회원 댓글. nickname 을 주지 않으면 기본값을 쓰고, 화면에는 뒤에 마스킹된 IP 가 붙는다.
     */
    public static Comment ofAnonymous(
            final Long tradeId,
            @Nullable final String nickname,
            final String maskedIp,
            final String content
    ) {
        if (maskedIp == null || maskedIp.isBlank()) {
            throw new InvalidCommentException(ErrorCode.INVALID_COMMENT_POLICY);
        }
        String resolved = (nickname == null || nickname.isBlank()) ? DEFAULT_ANONYMOUS_NICKNAME : nickname.strip();
        return new Comment(tradeId, null, resolved, maskedIp, null, content);
    }

    /**
     * 화면에 그대로 쓰는 이름. 비회원은 사칭을 막기 위해 마스킹된 IP 를 덧붙인다.
     */
    public String displayName() {
        if (ip == null) {
            return nickname;
        }
        return nickname + "-" + ip;
    }

    public boolean isAnonymous() {
        return memberId == null;
    }

    private void validateTradeId(final Long tradeId) {
        if (tradeId == null) {
            throw new InvalidCommentException(ErrorCode.INVALID_COMMENT_POLICY);
        }
    }

    private void validateNickname(final String nickname) {
        if (nickname == null || nickname.isBlank() || nickname.length() > MAX_NICKNAME_LENGTH) {
            throw new InvalidCommentException(ErrorCode.INVALID_COMMENT_POLICY);
        }
    }

    private void validateContent(final String content) {
        if (content == null || content.isBlank() || content.length() > MAX_CONTENT_LENGTH) {
            throw new InvalidCommentException(ErrorCode.INVALID_COMMENT_POLICY);
        }
    }
}

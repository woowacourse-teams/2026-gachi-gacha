package com.gachi.gacha.server.comment.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gachi.gacha.server.comment.domain.exception.InvalidCommentException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class CommentTest {

    private static final Long TRADE_ID = 1L;
    private static final Long MEMBER_ID = 10L;
    private static final String CONTENT = "저도 교환 원해요";
    private static final String MASKED_IP = "118.44";

    @Nested
    @DisplayName("비회원 댓글")
    class Anonymous {

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"   "})
        @DisplayName("이름을 주지 않으면 기본 닉네임을 쓴다.")
        void usesDefaultNickname(final String nickname) {
            Comment comment = Comment.ofAnonymous(TRADE_ID, nickname, MASKED_IP, CONTENT);

            assertThat(comment.getNickname()).isEqualTo(Comment.DEFAULT_ANONYMOUS_NICKNAME);
            assertThat(comment.displayName()).isEqualTo("루챠-118.44");
        }

        @Test
        @DisplayName("이름을 지정하면 그 이름 뒤에 마스킹된 IP 를 붙인다.")
        void appendsIpToCustomNickname() {
            Comment comment = Comment.ofAnonymous(TRADE_ID, "홍길동", MASKED_IP, CONTENT);

            assertThat(comment.displayName()).isEqualTo("홍길동-118.44");
        }

        @Test
        @DisplayName("IP 를 항상 남기고 프로필 사진은 갖지 않는다.")
        void keepsIpWithoutProfile() {
            Comment comment = Comment.ofAnonymous(TRADE_ID, null, MASKED_IP, CONTENT);

            assertThat(comment.getIp()).isEqualTo(MASKED_IP);
            assertThat(comment.getMemberId()).isNull();
            assertThat(comment.getProfileImageUrl()).isNull();
            assertThat(comment.isAnonymous()).isTrue();
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"   "})
        @DisplayName("IP 가 없으면 거부한다.")
        void rejectsMissingIp(final String ip) {
            assertThatThrownBy(() -> Comment.ofAnonymous(TRADE_ID, null, ip, CONTENT))
                    .isInstanceOf(InvalidCommentException.class)
                    .hasMessage(ErrorCode.INVALID_COMMENT_POLICY.getMessage());
        }
    }

    @Nested
    @DisplayName("회원 댓글")
    class MemberComment {

        @Test
        @DisplayName("작성 시점의 닉네임과 프로필을 복사해 두고 IP 는 남기지 않는다.")
        void snapshotsAuthor() {
            Comment comment = Comment.ofMember(TRADE_ID, MEMBER_ID, "가챠러버", "https://img/profile.jpg", CONTENT);

            assertThat(comment.getNickname()).isEqualTo("가챠러버");
            assertThat(comment.getProfileImageUrl()).isEqualTo("https://img/profile.jpg");
            assertThat(comment.getIp()).isNull();
            assertThat(comment.isAnonymous()).isFalse();
        }

        @Test
        @DisplayName("표시 이름에 IP 를 붙이지 않는다.")
        void showsNicknameOnly() {
            Comment comment = Comment.ofMember(TRADE_ID, MEMBER_ID, "가챠러버", null, CONTENT);

            assertThat(comment.displayName()).isEqualTo("가챠러버");
        }

        @Test
        @DisplayName("회원 ID 가 없으면 거부한다.")
        void rejectsMissingMemberId() {
            assertThatThrownBy(() -> Comment.ofMember(TRADE_ID, null, "가챠러버", null, CONTENT))
                    .isInstanceOf(InvalidCommentException.class);
        }
    }

    @Nested
    @DisplayName("공통 검증")
    class Validation {

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"   "})
        @DisplayName("내용이 비어 있으면 거부한다.")
        void rejectsBlankContent(final String content) {
            assertThatThrownBy(() -> Comment.ofAnonymous(TRADE_ID, null, MASKED_IP, content))
                    .isInstanceOf(InvalidCommentException.class);
        }

        @Test
        @DisplayName("내용이 500자를 넘으면 거부한다.")
        void rejectsTooLongContent() {
            String tooLong = "가".repeat(501);

            assertThatThrownBy(() -> Comment.ofAnonymous(TRADE_ID, null, MASKED_IP, tooLong))
                    .isInstanceOf(InvalidCommentException.class);
        }

        @Test
        @DisplayName("게시글 ID 가 없으면 거부한다.")
        void rejectsMissingTradeId() {
            assertThatThrownBy(() -> Comment.ofAnonymous(null, null, MASKED_IP, CONTENT))
                    .isInstanceOf(InvalidCommentException.class);
        }
    }
}

package com.gachi.gacha.server.comment.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.server.comment.application.dto.CommentCreateCommand;
import com.gachi.gacha.server.comment.application.dto.CommentInfo;
import com.gachi.gacha.server.comment.domain.Comment;
import com.gachi.gacha.server.comment.domain.CommentJpaRepository;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.domain.exception.TradeNotFoundException;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    private static final Long TRADE_ID = 1L;
    private static final Long MEMBER_ID = 10L;
    private static final String MASKED_IP = "118.44";
    private static final String CONTENT = "저도 교환 원해요";

    @Mock
    private CommentJpaRepository commentJpaRepository;

    @Mock
    private TradeJpaRepository tradeJpaRepository;

    @Mock
    private MemberJpaRepository memberJpaRepository;

    @InjectMocks
    private CommentService commentService;

    private ArgumentCaptor<Comment> captureSavedComment() {
        ArgumentCaptor<Comment> captor = ArgumentCaptor.forClass(Comment.class);
        given(commentJpaRepository.save(captor.capture())).willAnswer(it -> it.getArgument(0));
        return captor;
    }

    @Nested
    @DisplayName("댓글 작성")
    class Create {

        @Test
        @DisplayName("비회원이면 마스킹된 IP 를 남기고 회원 정보는 조회하지 않는다.")
        void savesAnonymousComment() {
            ArgumentCaptor<Comment> captor = captureSavedComment();

            CommentInfo info = commentService.createComment(
                    TRADE_ID, null, MASKED_IP, new CommentCreateCommand(null, CONTENT));

            Comment saved = captor.getValue();
            assertThat(saved.getMemberId()).isNull();
            assertThat(saved.getIp()).isEqualTo(MASKED_IP);
            assertThat(info.nickname()).isEqualTo("루챠-118.44");
            verify(memberJpaRepository, never()).getMemberById(any());
        }

        @Test
        @DisplayName("비회원이 이름을 지정하면 그 이름에 IP 를 붙인다.")
        void usesGivenNickname() {
            captureSavedComment();

            CommentInfo info = commentService.createComment(
                    TRADE_ID, null, MASKED_IP, new CommentCreateCommand("홍길동", CONTENT));

            assertThat(info.nickname()).isEqualTo("홍길동-118.44");
        }

        @Test
        @DisplayName("회원이면 요청의 nickname 을 무시하고 회원 닉네임을 쓴다.")
        void ignoresNicknameForMember() {
            Member member = Member.builder()
                    .id(MEMBER_ID)
                    .nickname("가챠러버")
                    .profileImageUrl("https://img/profile.jpg")
                    .build();
            given(memberJpaRepository.getMemberById(MEMBER_ID)).willReturn(member);
            ArgumentCaptor<Comment> captor = captureSavedComment();

            CommentInfo info = commentService.createComment(
                    TRADE_ID, MEMBER_ID, MASKED_IP, new CommentCreateCommand("사칭닉네임", CONTENT));

            Comment saved = captor.getValue();
            assertThat(saved.getNickname()).isEqualTo("가챠러버");
            assertThat(saved.getIp()).isNull();
            assertThat(info.nickname()).isEqualTo("가챠러버");
            assertThat(info.profileImageUrl()).isEqualTo("https://img/profile.jpg");
        }

        @Test
        @DisplayName("없는 게시글이면 저장하지 않는다.")
        void rejectsMissingTrade() {
            willThrow(new TradeNotFoundException(ErrorCode.TRADE_NOT_FOUND))
                    .given(tradeJpaRepository).getById(TRADE_ID);

            assertThatThrownBy(() -> commentService.createComment(
                    TRADE_ID, null, MASKED_IP, new CommentCreateCommand(null, CONTENT)))
                    .isInstanceOf(TradeNotFoundException.class);

            verify(commentJpaRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("댓글 조회")
    class Read {

        @Test
        @DisplayName("등록순으로 반환하며 회원·비회원 표시 이름이 각각 적용된다.")
        void returnsCommentsInOrder() {
            given(commentJpaRepository.findAllByTradeIdOrderByIdAsc(TRADE_ID)).willReturn(List.of(
                    Comment.ofAnonymous(TRADE_ID, null, MASKED_IP, "첫 댓글"),
                    Comment.ofMember(TRADE_ID, MEMBER_ID, "가챠러버", null, "둘째 댓글")
            ));

            List<CommentInfo> infos = commentService.findComments(TRADE_ID);

            assertThat(infos).extracting(CommentInfo::nickname)
                    .containsExactly("루챠-118.44", "가챠러버");
        }

        @Test
        @DisplayName("없는 게시글이면 조회하지 않는다.")
        void rejectsMissingTrade() {
            willThrow(new TradeNotFoundException(ErrorCode.TRADE_NOT_FOUND))
                    .given(tradeJpaRepository).getById(TRADE_ID);

            assertThatThrownBy(() -> commentService.findComments(TRADE_ID))
                    .isInstanceOf(TradeNotFoundException.class);
        }
    }
}

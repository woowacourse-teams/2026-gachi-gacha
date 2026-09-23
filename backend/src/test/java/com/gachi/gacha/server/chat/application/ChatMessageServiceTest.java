package com.gachi.gacha.server.chat.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.gachi.gacha.server.chat.application.dto.ChatMessageInfo;
import com.gachi.gacha.server.chat.application.dto.ChatMessageSendCommand;
import com.gachi.gacha.server.chat.domain.ChatMessage;
import com.gachi.gacha.server.chat.domain.ChatMessageMongoRepository;
import com.gachi.gacha.server.chat.domain.ChatRoom;
import com.gachi.gacha.server.chat.domain.ChatRoomJpaRepository;
import com.gachi.gacha.server.chat.domain.ChatRoomMember;
import com.gachi.gacha.server.chat.domain.ChatRoomMemberJpaRepository;
import com.gachi.gacha.server.chat.domain.MessageType;
import com.gachi.gacha.server.chat.domain.exception.ChatRoomAccessDeniedException;
import com.gachi.gacha.server.chat.domain.exception.InvalidChatMessageException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.Member;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ChatMessageServiceTest {

    private static final Long ROOM_ID = 1L;
    private static final Long SENDER_ID = 2L;

    @Mock
    private ChatRoomJpaRepository chatRoomJpaRepository;

    @Mock
    private ChatRoomMemberJpaRepository chatRoomMemberJpaRepository;

    @Mock
    private ChatMessageMongoRepository chatMessageMongoRepository;

    @InjectMocks
    private ChatMessageService chatMessageService;

    private ChatRoom chatRoom;
    private ChatRoomMember sender;

    @BeforeEach
    void setUp() {
        chatRoom = ChatRoom.create(ROOM_ID);
        sender = ChatRoomMember.join(chatRoom, Member.builder().nickname("개발용 요청자").build());
    }

    private ChatMessageSendCommand textCommand(final String content) {
        return new ChatMessageSendCommand(MessageType.TEXT, content, List.of());
    }

    private void givenRoomAndSender() {
        given(chatRoomJpaRepository.getByIdForUpdate(ROOM_ID)).willReturn(chatRoom);
        given(chatRoomMemberJpaRepository.getByRoomIdAndMemberId(ROOM_ID, SENDER_ID)).willReturn(sender);
        given(chatMessageMongoRepository.save(any(ChatMessage.class)))
                .willAnswer(invocation -> invocation.getArgument(0));
    }

    @Nested
    @DisplayName("메시지 전송")
    class SendMessage {

        @Test
        @DisplayName("메시지를 저장하고 채팅방의 최근 메시지 정보를 갱신한다")
        void sendMessage_success() {
            givenRoomAndSender();

            ChatMessageInfo info = chatMessageService.sendMessage(SENDER_ID, ROOM_ID, textCommand("안녕하세요"));

            assertThat(info.sequence()).isEqualTo(1L);
            assertThat(info.senderId()).isEqualTo(SENDER_ID);
            assertThat(info.type()).isEqualTo(MessageType.TEXT);
            assertThat(chatRoom.getLastMessageSequence()).isEqualTo(1L);
            assertThat(chatRoom.getLastMessagePreview()).isEqualTo("안녕하세요");
            assertThat(chatRoom.getLastMessageAt()).isNotNull();
        }

        @Test
        @DisplayName("보낸 사람의 읽음 sequence를 방금 보낸 메시지로 갱신한다")
        void sendMessage_updatesSenderReadSequence() {
            givenRoomAndSender();

            chatMessageService.sendMessage(SENDER_ID, ROOM_ID, textCommand("안녕하세요"));

            assertThat(sender.getLastReadMessageSequence()).isEqualTo(1L);
        }

        @Test
        @DisplayName("연속으로 전송하면 sequence가 1씩 증가한다")
        void sendMessage_increasesSequence() {
            givenRoomAndSender();

            ChatMessageInfo first = chatMessageService.sendMessage(SENDER_ID, ROOM_ID, textCommand("첫 번째"));
            ChatMessageInfo second = chatMessageService.sendMessage(SENDER_ID, ROOM_ID, textCommand("두 번째"));

            assertThat(first.sequence()).isEqualTo(1L);
            assertThat(second.sequence()).isEqualTo(2L);
        }

        @Test
        @DisplayName("메시지 검증에 실패하면 채팅방을 조회하지 않는다")
        void sendMessage_invalidMessage() {
            assertThatThrownBy(() -> chatMessageService.sendMessage(SENDER_ID, ROOM_ID, textCommand(" ")))
                    .isInstanceOf(InvalidChatMessageException.class);

            verifyNoInteractions(chatRoomJpaRepository, chatRoomMemberJpaRepository, chatMessageMongoRepository);
        }

        @Test
        @DisplayName("참여자가 아니면 메시지를 저장하지 않고 sequence도 증가하지 않는다")
        void sendMessage_notJoinedMember() {
            given(chatRoomJpaRepository.getByIdForUpdate(ROOM_ID)).willReturn(chatRoom);
            given(chatRoomMemberJpaRepository.getByRoomIdAndMemberId(ROOM_ID, SENDER_ID))
                    .willThrow(new ChatRoomAccessDeniedException(ErrorCode.CHAT_ROOM_ACCESS_DENIED));

            assertThatThrownBy(() -> chatMessageService.sendMessage(SENDER_ID, ROOM_ID, textCommand("안녕하세요")))
                    .isInstanceOf(ChatRoomAccessDeniedException.class);

            verify(chatMessageMongoRepository, never()).save(any());
            assertThat(chatRoom.getLastMessageSequence()).isZero();
        }

        @Test
        @DisplayName("내용 없는 이미지 메시지는 미리보기를 '사진'으로 저장한다")
        void sendMessage_imagePreview() {
            givenRoomAndSender();
            ChatMessageSendCommand command = new ChatMessageSendCommand(
                    MessageType.IMAGE,
                    null,
                    List.of(new ChatMessageSendCommand.FileCommand(
                            "https://cdn.example.com/files/uuid-kuromi.jpg", "kuromi.jpg", "image/jpeg", 102_400L))
            );

            chatMessageService.sendMessage(SENDER_ID, ROOM_ID, command);

            assertThat(chatRoom.getLastMessagePreview()).isEqualTo("사진");
        }
    }
}

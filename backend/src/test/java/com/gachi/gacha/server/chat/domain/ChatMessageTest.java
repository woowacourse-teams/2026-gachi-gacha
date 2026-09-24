package com.gachi.gacha.server.chat.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gachi.gacha.server.chat.domain.exception.InvalidChatMessageException;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class ChatMessageTest {

    private static final Long ROOM_ID = 1L;
    private static final Long SENDER_ID = 2L;
    private static final Long SEQUENCE = 10L;

    private static ChatMessage.MessageFile file() {
        return ChatMessage.MessageFile.builder()
                .mediaUrl("https://cdn.example.com/files/uuid-kuromi.jpg")
                .fileName("kuromi.jpg")
                .contentType("image/jpeg")
                .fileSize(102_400L)
                .build();
    }

    @Nested
    @DisplayName("메시지 검증")
    class Validate {

        @Test
        @DisplayName("TEXT 메시지는 내용이 있으면 통과한다")
        void text_withContent() {
            assertThatCode(() -> ChatMessage.validate(MessageType.TEXT, "안녕하세요", List.of()))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("TEXT 메시지의 내용이 비어 있으면 예외가 발생한다")
        void text_withoutContent() {
            assertThatThrownBy(() -> ChatMessage.validate(MessageType.TEXT, "   ", List.of()))
                    .isInstanceOf(InvalidChatMessageException.class);
        }

        @Test
        @DisplayName("TEXT 메시지에 파일이 포함되면 예외가 발생한다")
        void text_withFiles() {
            assertThatThrownBy(() -> ChatMessage.validate(MessageType.TEXT, "안녕하세요", List.of(file())))
                    .isInstanceOf(InvalidChatMessageException.class);
        }

        @Test
        @DisplayName("IMAGE 메시지는 파일이 있으면 내용이 없어도 통과한다")
        void image_withFile() {
            assertThatCode(() -> ChatMessage.validate(MessageType.IMAGE, null, List.of(file())))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("IMAGE 메시지에 파일이 없으면 예외가 발생한다")
        void image_withoutFiles() {
            assertThatThrownBy(() -> ChatMessage.validate(MessageType.IMAGE, "사진입니다", List.of()))
                    .isInstanceOf(InvalidChatMessageException.class);
        }

        @Test
        @DisplayName("FILE 메시지에 파일이 없으면 예외가 발생한다")
        void file_withoutFiles() {
            assertThatThrownBy(() -> ChatMessage.validate(MessageType.FILE, null, null))
                    .isInstanceOf(InvalidChatMessageException.class);
        }

        @ParameterizedTest
        @EnumSource(value = MessageType.class, names = {"ENTER", "LEAVE"})
        @DisplayName("전송할 수 없는 타입이면 예외가 발생한다")
        void notSendableType(final MessageType type) {
            assertThatThrownBy(() -> ChatMessage.validate(type, "입장했습니다", List.of()))
                    .isInstanceOf(InvalidChatMessageException.class);
        }

        @Test
        @DisplayName("타입이 없으면 예외가 발생한다")
        void nullType() {
            assertThatThrownBy(() -> ChatMessage.validate(null, "안녕하세요", List.of()))
                    .isInstanceOf(InvalidChatMessageException.class);
        }

        @Test
        @DisplayName("내용이 1000자이면 통과하고 1001자이면 예외가 발생한다")
        void contentLength() {
            assertThatCode(() -> ChatMessage.validate(MessageType.TEXT, "가".repeat(1000), List.of()))
                    .doesNotThrowAnyException();
            assertThatThrownBy(() -> ChatMessage.validate(MessageType.TEXT, "가".repeat(1001), List.of()))
                    .isInstanceOf(InvalidChatMessageException.class);
        }

        @Test
        @DisplayName("파일이 10개이면 통과하고 11개이면 예외가 발생한다")
        void fileCount() {
            assertThatCode(() -> ChatMessage.validate(MessageType.IMAGE, null, Collections.nCopies(10, file())))
                    .doesNotThrowAnyException();
            assertThatThrownBy(() -> ChatMessage.validate(MessageType.IMAGE, null, Collections.nCopies(11, file())))
                    .isInstanceOf(InvalidChatMessageException.class);
        }
    }

    @Nested
    @DisplayName("미리보기")
    class Preview {

        @Test
        @DisplayName("내용이 있으면 내용을 그대로 사용한다")
        void withContent() {
            assertThat(ChatMessage.preview(MessageType.TEXT, "오늘 오후 7시에 가능할까요?"))
                    .isEqualTo("오늘 오후 7시에 가능할까요?");
        }

        @Test
        @DisplayName("내용이 100자를 넘으면 100자까지만 사용한다")
        void truncatesLongContent() {
            String preview = ChatMessage.preview(MessageType.TEXT, "가".repeat(150));

            assertThat(preview).hasSize(100);
        }

        @Test
        @DisplayName("내용이 없는 IMAGE 메시지는 '사진'으로 표시한다")
        void imageWithoutContent() {
            assertThat(ChatMessage.preview(MessageType.IMAGE, null)).isEqualTo("사진");
        }

        @Test
        @DisplayName("내용이 없는 FILE 메시지는 '파일'로 표시한다")
        void fileWithoutContent() {
            assertThat(ChatMessage.preview(MessageType.FILE, " ")).isEqualTo("파일");
        }
    }

    @Nested
    @DisplayName("메시지 생성")
    class Create {

        @Test
        @DisplayName("전달받은 값으로 메시지를 생성한다")
        void create_success() {
            ChatMessage message = ChatMessage.create(
                    ROOM_ID, SENDER_ID, SEQUENCE, MessageType.IMAGE, "사진입니다", List.of(file()));

            assertThat(message.getRoomId()).isEqualTo(ROOM_ID);
            assertThat(message.getSenderId()).isEqualTo(SENDER_ID);
            assertThat(message.getSequence()).isEqualTo(SEQUENCE);
            assertThat(message.getType()).isEqualTo(MessageType.IMAGE);
            assertThat(message.getContent()).isEqualTo("사진입니다");
            assertThat(message.getFiles()).hasSize(1);
        }

        @Test
        @DisplayName("파일이 null이면 빈 목록으로 생성한다")
        void create_withNullFiles() {
            ChatMessage message = ChatMessage.create(
                    ROOM_ID, SENDER_ID, SEQUENCE, MessageType.TEXT, "안녕하세요", null);

            assertThat(message.getFiles()).isEmpty();
        }

        @Test
        @DisplayName("검증에 실패하는 값이면 생성할 수 없다")
        void create_invalid() {
            assertThatThrownBy(() -> ChatMessage.create(
                    ROOM_ID, SENDER_ID, SEQUENCE, MessageType.TEXT, null, List.of()))
                    .isInstanceOf(InvalidChatMessageException.class);
        }
    }
}

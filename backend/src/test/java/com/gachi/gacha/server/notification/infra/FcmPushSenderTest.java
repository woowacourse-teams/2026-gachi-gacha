package com.gachi.gacha.server.notification.infra;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;

import com.gachi.gacha.server.notification.application.PushMessage;
import com.gachi.gacha.server.notification.application.PushResult;
import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.SendResponse;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class FcmPushSenderTest {

    private static final PushMessage MESSAGE = new PushMessage("제목", "본문", Map.of("type", "CHAT"), "chat-1");

    @Mock
    private FirebaseMessaging firebaseMessaging;

    private FcmPushSender fcmPushSender;

    @BeforeEach
    void setUp() {
        // 재시도 전 대기는 테스트에서 건너뛴다. 대기를 하는지는 따로 확인한다
        fcmPushSender = spy(new FcmPushSender(firebaseMessaging));
        lenient().doNothing().when(fcmPushSender).pause();
    }

    @Test
    @DisplayName("앱이 삭제됐거나 다른 프로젝트의 토큰이면 무효 토큰으로 돌려준다")
    void send_returnsInvalidTokens() throws FirebaseMessagingException {
        // given
        BatchResponse response = batchResponse(List.of(
                success(),
                failure(MessagingErrorCode.UNREGISTERED),
                failure(MessagingErrorCode.SENDER_ID_MISMATCH)
        ));
        given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class))).willReturn(response);

        // when
        List<String> invalidTokens = fcmPushSender.send(List.of("valid", "uninstalled", "other-project"), MESSAGE);

        // then
        assertThat(invalidTokens).containsExactly("uninstalled", "other-project");
    }

    @Test
    @DisplayName("일시적인 오류로 실패한 토큰은 무효 토큰으로 보지 않는다")
    void send_keepsTokensOfTemporaryFailure() throws FirebaseMessagingException {
        // given
        BatchResponse response = batchResponse(List.of(failure(MessagingErrorCode.UNAVAILABLE)));
        given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class))).willReturn(response);

        // when
        List<String> invalidTokens = fcmPushSender.send(List.of("token"), MESSAGE);

        // then
        assertThat(invalidTokens).isEmpty();
    }

    @Test
    @DisplayName("발송 요청 자체가 실패해도 예외를 던지지 않는다")
    void send_doesNotThrowOnFailure() throws FirebaseMessagingException {
        // given
        given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class)))
                .willThrow(mock(FirebaseMessagingException.class));

        // when
        List<String> invalidTokens = fcmPushSender.send(List.of("token"), MESSAGE);

        // then
        assertThat(invalidTokens).isEmpty();
    }

    @Nested
    @DisplayName("결과를 돌려주는 발송")
    class SendWithResult {

        @Test
        @DisplayName("성공·실패·무효 토큰을 센다. 무효 토큰은 실패에도 포함한다")
        void countsSuccessFailureAndInvalid() throws FirebaseMessagingException {
            BatchResponse response = batchResponse(List.of(
                    success(), success(), failure(MessagingErrorCode.UNREGISTERED), failure(MessagingErrorCode.QUOTA_EXCEEDED)));
            given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class))).willReturn(response);

            PushResult result = fcmPushSender.sendWithResult(List.of("a", "b", "c", "d"), MESSAGE);

            assertThat(result).isEqualTo(new PushResult(2, 2, 0, List.of("c")));
        }

        @Test
        @DisplayName("기존 send 는 같은 발송에서 무효 토큰만 돌려준다 (채팅·댓글 알림이 쓰는 방식)")
        void legacySendReturnsInvalidTokensOnly() throws FirebaseMessagingException {
            BatchResponse response = batchResponse(List.of(success(), failure(MessagingErrorCode.SENDER_ID_MISMATCH)));
            given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class))).willReturn(response);

            assertThat(fcmPushSender.send(List.of("ok", "other-project"), MESSAGE)).containsExactly("other-project");
        }

        @Test
        @DisplayName("토큰이 없으면 호출하지 않는다")
        void noTokensNoCall() {
            assertThat(fcmPushSender.sendWithResult(List.of(), MESSAGE)).isEqualTo(PushResult.NONE);

            then(firebaseMessaging).shouldHaveNoInteractions();
        }
    }

    @Nested
    @DisplayName("500개씩 나누기")
    class Chunking {

        @Test
        @DisplayName("500개 이하는 한 번에 보낸다")
        void fiveHundredIsOneCall() throws FirebaseMessagingException {
            BatchResponse response = allSuccess(500);
            given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class))).willReturn(response);

            PushResult result = fcmPushSender.sendWithResult(tokens(500), MESSAGE);

            then(firebaseMessaging).should(times(1)).sendEachForMulticast(any(MulticastMessage.class));
            assertThat(result.successCount()).isEqualTo(500);
        }

        @Test
        @DisplayName("501개 이상은 500개씩 나눠 보내고, 결과는 합친다 (1201개 → 500, 500, 201)")
        void splitsByFiveHundred() throws FirebaseMessagingException {
            BatchResponse first = allSuccess(500);
            BatchResponse second = allSuccess(500);
            BatchResponse third = allSuccess(201);
            given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class))).willReturn(first, second, third);

            PushResult result = fcmPushSender.sendWithResult(tokens(1201), MESSAGE);

            ArgumentCaptor<MulticastMessage> sent = ArgumentCaptor.forClass(MulticastMessage.class);
            then(firebaseMessaging).should(times(3)).sendEachForMulticast(sent.capture());
            assertThat(sent.getAllValues()).extracting(message -> tokensOf(message).size()).containsExactly(500, 500, 201);
            assertThat(tokensOf(sent.getAllValues().get(0)).getFirst()).isEqualTo("token-0");
            assertThat(tokensOf(sent.getAllValues().get(1)).getFirst()).isEqualTo("token-500");
            assertThat(tokensOf(sent.getAllValues().get(2)).getLast()).isEqualTo("token-1200");
            assertThat(result).isEqualTo(new PushResult(1201, 0, 0, List.of()));
        }

        @Test
        @DisplayName("한 묶음의 호출이 예외로 실패해도 다른 묶음은 계속 보내고, 그 묶음 토큰은 '알 수 없음'으로 센다")
        void failedChunkDoesNotStopOthers() throws FirebaseMessagingException {
            BatchResponse first = allSuccess(500);
            BatchResponse third = allSuccess(1);
            FirebaseMessagingException failed = mock(FirebaseMessagingException.class);
            given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class)))
                    .willReturn(first)
                    .willThrow(failed)
                    .willReturn(third);

            PushResult result = fcmPushSender.sendWithResult(tokens(1001), MESSAGE);

            then(firebaseMessaging).should(times(3)).sendEachForMulticast(any(MulticastMessage.class));
            assertThat(result).isEqualTo(new PushResult(501, 0, 500, List.of()));
        }
    }

    @Nested
    @DisplayName("일시 오류 토큰 재시도")
    class Retry {

        @Test
        @DisplayName("UNAVAILABLE·INTERNAL 토큰만 모아 기다린 뒤 한 번 다시 보내고, 나머지 토큰은 다시 보내지 않는다")
        void retriesOnlyTemporaryFailuresOnce() throws FirebaseMessagingException {
            BatchResponse first = batchResponse(List.of(success(), failure(MessagingErrorCode.UNAVAILABLE),
                    failure(MessagingErrorCode.INTERNAL), failure(MessagingErrorCode.QUOTA_EXCEEDED)));
            BatchResponse second = batchResponse(List.of(success(), success()));
            given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class))).willReturn(first, second);

            PushResult result = fcmPushSender.sendWithResult(List.of("ok", "unavailable", "internal", "quota"), MESSAGE);

            ArgumentCaptor<MulticastMessage> sent = ArgumentCaptor.forClass(MulticastMessage.class);
            then(firebaseMessaging).should(times(2)).sendEachForMulticast(sent.capture());
            assertThat(tokensOf(sent.getAllValues().get(1))).containsExactly("unavailable", "internal");
            then(fcmPushSender).should().pause();
            assertThat(result).isEqualTo(new PushResult(3, 1, 0, List.of()));
        }

        @Test
        @DisplayName("재시도도 실패하면 실패로 세고 더 시도하지 않는다 (재시도는 한 번뿐)")
        void retriesOnlyOnce() throws FirebaseMessagingException {
            BatchResponse first = batchResponse(List.of(failure(MessagingErrorCode.UNAVAILABLE)));
            BatchResponse second = batchResponse(List.of(failure(MessagingErrorCode.UNAVAILABLE)));
            given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class))).willReturn(first, second);

            PushResult result = fcmPushSender.sendWithResult(List.of("token"), MESSAGE);

            then(firebaseMessaging).should(times(2)).sendEachForMulticast(any(MulticastMessage.class));
            assertThat(result).isEqualTo(new PushResult(0, 1, 0, List.of()));
        }

        @Test
        @DisplayName("다른 오류(할당량 초과, 잘못된 인자, 인증 오류, 무효 토큰)는 다시 시도하지 않는다")
        void doesNotRetryOtherErrors() throws FirebaseMessagingException {
            BatchResponse response = batchResponse(List.of(
                    failure(MessagingErrorCode.QUOTA_EXCEEDED), failure(MessagingErrorCode.INVALID_ARGUMENT),
                    failure(MessagingErrorCode.THIRD_PARTY_AUTH_ERROR), failure(MessagingErrorCode.UNREGISTERED),
                    failure(MessagingErrorCode.SENDER_ID_MISMATCH)));
            given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class))).willReturn(response);

            PushResult result = fcmPushSender.sendWithResult(List.of("a", "b", "c", "d", "e"), MESSAGE);

            then(firebaseMessaging).should(times(1)).sendEachForMulticast(any(MulticastMessage.class));
            then(fcmPushSender).should(never()).pause();
            assertThat(result).isEqualTo(new PushResult(0, 5, 0, List.of("d", "e")));
        }

        @Test
        @DisplayName("재시도에서 무효 토큰으로 밝혀지면 무효 토큰에 포함한다")
        void invalidTokenFoundOnRetry() throws FirebaseMessagingException {
            BatchResponse first = batchResponse(List.of(failure(MessagingErrorCode.INTERNAL)));
            BatchResponse second = batchResponse(List.of(failure(MessagingErrorCode.UNREGISTERED)));
            given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class))).willReturn(first, second);

            PushResult result = fcmPushSender.sendWithResult(List.of("gone"), MESSAGE);

            assertThat(result).isEqualTo(new PushResult(0, 1, 0, List.of("gone")));
        }

        @Test
        @DisplayName("재시도 호출이 예외로 끝나면 그 토큰은 받아들여졌는지 알 수 없으니 '알 수 없음'으로 세고 더 보내지 않는다")
        void retryCallFailureIsUnknown() throws FirebaseMessagingException {
            BatchResponse first = batchResponse(List.of(success(), failure(MessagingErrorCode.UNAVAILABLE)));
            FirebaseMessagingException failed = mock(FirebaseMessagingException.class);
            given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class))).willReturn(first).willThrow(failed);

            PushResult result = fcmPushSender.sendWithResult(List.of("ok", "unavailable"), MESSAGE);

            then(firebaseMessaging).should(times(2)).sendEachForMulticast(any(MulticastMessage.class));
            assertThat(result).isEqualTo(new PushResult(1, 0, 1, List.of()));
        }

        @Test
        @DisplayName("묶음마다 따로 재시도하고, 재시도할 토큰이 없는 묶음은 기다리지 않는다")
        void retriesPerChunk() throws FirebaseMessagingException {
            List<SendResponse> firstChunk = IntStream.range(0, 500)
                    .mapToObj(index -> index == 7 ? failure(MessagingErrorCode.UNAVAILABLE) : success()).toList();
            BatchResponse first = batchResponse(firstChunk);
            BatchResponse retried = batchResponse(List.of(success()));
            BatchResponse second = allSuccess(10);
            given(firebaseMessaging.sendEachForMulticast(any(MulticastMessage.class))).willReturn(first, retried, second);

            PushResult result = fcmPushSender.sendWithResult(tokens(510), MESSAGE);

            ArgumentCaptor<MulticastMessage> sent = ArgumentCaptor.forClass(MulticastMessage.class);
            then(firebaseMessaging).should(times(3)).sendEachForMulticast(sent.capture());
            assertThat(tokensOf(sent.getAllValues().get(1))).containsExactly("token-7");
            assertThat(tokensOf(sent.getAllValues().get(2))).hasSize(10);
            then(fcmPushSender).should(times(1)).pause();
            assertThat(result).isEqualTo(new PushResult(510, 0, 0, List.of()));
        }
    }

    private List<String> tokens(final int count) {
        return IntStream.range(0, count).mapToObj(index -> "token-" + index).toList();
    }

    @SuppressWarnings("unchecked")
    private List<String> tokensOf(final MulticastMessage message) {
        return (List<String>) ReflectionTestUtils.getField(message, "tokens");
    }

    private BatchResponse allSuccess(final int count) {
        return batchResponse(IntStream.range(0, count).mapToObj(index -> success()).toList());
    }

    private BatchResponse batchResponse(final List<SendResponse> responses) {
        BatchResponse response = mock(BatchResponse.class);
        given(response.getResponses()).willReturn(responses);
        return response;
    }

    private SendResponse success() {
        SendResponse response = mock(SendResponse.class);
        given(response.isSuccessful()).willReturn(true);
        return response;
    }

    private SendResponse failure(final MessagingErrorCode errorCode) {
        FirebaseMessagingException exception = mock(FirebaseMessagingException.class);
        given(exception.getMessagingErrorCode()).willReturn(errorCode);

        SendResponse response = mock(SendResponse.class);
        given(response.isSuccessful()).willReturn(false);
        given(response.getException()).willReturn(exception);
        return response;
    }
}

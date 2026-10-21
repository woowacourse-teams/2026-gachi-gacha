package com.gachi.gacha.server.notification.infra;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import com.gachi.gacha.server.notification.application.PushMessage;
import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.SendResponse;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FcmPushSenderTest {

    private static final PushMessage MESSAGE = new PushMessage("제목", "본문", Map.of("type", "CHAT"), "chat-1");

    @Mock
    private FirebaseMessaging firebaseMessaging;

    @InjectMocks
    private FcmPushSender fcmPushSender;

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

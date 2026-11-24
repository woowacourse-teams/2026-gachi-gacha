package com.gachi.gacha.server.notification.infra;

import com.gachi.gacha.server.notification.application.PushMessage;
import com.gachi.gacha.server.notification.application.PushResult;
import com.gachi.gacha.server.notification.application.PushSender;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.AndroidNotification;
import com.google.firebase.messaging.ApnsConfig;
import com.google.firebase.messaging.Aps;
import com.google.firebase.messaging.ApsAlert;
import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import com.google.firebase.messaging.SendResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnBooleanProperty("firebase.push-enabled")
public class FcmPushSender implements PushSender {

    private static final String DEFAULT_SOUND = "default";
    private static final String APNS_COLLAPSE_ID_HEADER = "apns-collapse-id";

    /**
     * 앱을 지웠거나(UNREGISTERED) 다른 Firebase 프로젝트의 토큰인(SENDER_ID_MISMATCH) 경우다.
     * INVALID_ARGUMENT 는 메시지 자체가 잘못됐을 때도 나므로 토큰을 지우는 기준으로 쓰지 않는다.
     */
    private static final Set<MessagingErrorCode> INVALID_TOKEN_ERRORS = Set.of(
            MessagingErrorCode.UNREGISTERED,
            MessagingErrorCode.SENDER_ID_MISMATCH
    );

    /**
     * FCM 멀티캐스트 한 번에 보낼 수 있는 토큰의 최대 수.
     */
    private static final int MAX_TOKENS_PER_MULTICAST = 500;

    /**
     * FCM 이 서버 사정(UNAVAILABLE)이나 내부 오류(INTERNAL)로 받지 못했다고 알려 준 경우다. FCM 이 받지 않았으니 다시 보내도
     * 중복되지 않아서 그 토큰만 한 번 다시 시도한다. 다른 오류는 다시 해도 같은 결과라 시도하지 않는다.
     */
    private static final Set<MessagingErrorCode> RETRYABLE_ERRORS = Set.of(
            MessagingErrorCode.UNAVAILABLE,
            MessagingErrorCode.INTERNAL
    );

    private static final Duration RETRY_DELAY = Duration.ofSeconds(2);

    private final FirebaseMessaging firebaseMessaging;

    @Override
    public PushResult sendWithResult(final List<String> tokens, final PushMessage message) {
        PushResult total = PushResult.NONE;
        for (int from = 0; from < tokens.size(); from += MAX_TOKENS_PER_MULTICAST) {
            List<String> chunk = tokens.subList(from, Math.min(from + MAX_TOKENS_PER_MULTICAST, tokens.size()));
            total = total.plus(sendChunk(chunk, message));
        }
        return total;
    }

    /**
     * 한 번에 보낼 수 있는 만큼을 보내고, 일시 오류로 받지 못한 토큰만 한 번 다시 보낸다.
     */
    private PushResult sendChunk(final List<String> chunk, final PushMessage message) {
        List<SendResponse> responses;
        try {
            responses = firebaseMessaging.sendEachForMulticast(toMulticastMessage(chunk, message)).getResponses();
        } catch (FirebaseMessagingException e) {
            log.error("FCM 푸시 발송 실패. tokenCount = {}", chunk.size(), e);
            return new PushResult(0, 0, chunk.size(), List.of());
        }
        logFailures(responses);
        List<String> retryTokens = findTokens(chunk, responses, RETRYABLE_ERRORS);
        int success = countSuccess(responses);
        PushResult first = new PushResult(success, chunk.size() - success - retryTokens.size(), 0, findInvalidTokens(chunk, responses));
        return retryTokens.isEmpty() ? first : first.plus(retry(retryTokens, message));
    }

    private PushResult retry(final List<String> tokens, final PushMessage message) {
        pause();
        List<SendResponse> responses;
        try {
            responses = firebaseMessaging.sendEachForMulticast(toMulticastMessage(tokens, message)).getResponses();
        } catch (FirebaseMessagingException e) {
            log.error("FCM 푸시 재시도 실패. tokenCount = {}", tokens.size(), e);
            return new PushResult(0, 0, tokens.size(), List.of());
        }
        logFailures(responses);
        int success = countSuccess(responses);
        return new PushResult(success, tokens.size() - success, 0, findInvalidTokens(tokens, responses));
    }

    /**
     * 다시 시도하기 전에 잠깐 기다린다. 테스트에서는 기다리지 않도록 바꿀 수 있게 열어 둔다.
     */
    void pause() {
        try {
            Thread.sleep(RETRY_DELAY);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private MulticastMessage toMulticastMessage(final List<String> tokens, final PushMessage message) {
        return MulticastMessage.builder()
                .addAllTokens(tokens)
                .setNotification(Notification.builder()
                        .setTitle(message.title())
                        .setBody(message.body())
                        .build())
                .putAllData(message.data())
                .setAndroidConfig(toAndroidConfig(message))
                .setApnsConfig(toApnsConfig(message))
                .build();
    }

    private AndroidConfig toAndroidConfig(final PushMessage message) {
        AndroidNotification.Builder notification = AndroidNotification.builder()
                .setSound(DEFAULT_SOUND);
        AndroidConfig.Builder config = AndroidConfig.builder()
                .setPriority(AndroidConfig.Priority.HIGH);

        if (message.collapseKey() != null) {
            notification.setTag(message.collapseKey());
            config.setCollapseKey(message.collapseKey());
        }
        return config.setNotification(notification.build()).build();
    }

    private ApnsConfig toApnsConfig(final PushMessage message) {
        Aps aps = Aps.builder()
                .setAlert(ApsAlert.builder()
                        .setTitle(message.title())
                        .setBody(message.body())
                        .build())
                .setSound(DEFAULT_SOUND)
                .build();
        ApnsConfig.Builder config = ApnsConfig.builder().setAps(aps);

        if (message.collapseKey() != null) {
            config.putHeader(APNS_COLLAPSE_ID_HEADER, message.collapseKey());
        }
        return config.build();
    }

    /**
     * 토큰 값은 남기지 않고 실패 건수와 에러 코드만 남긴다.
     */
    private void logFailures(final List<SendResponse> responses) {
        List<MessagingErrorCode> errorCodes = responses.stream()
                .filter(response -> !response.isSuccessful())
                .map(SendResponse::getException)
                .filter(Objects::nonNull)
                .map(FirebaseMessagingException::getMessagingErrorCode)
                .toList();
        if (errorCodes.isEmpty()) {
            return;
        }
        log.warn("FCM 일부 토큰 발송 실패. tokenCount = {}, failureCount = {}, errorCodes = {}",
                responses.size(), errorCodes.size(), errorCodes);
    }

    private int countSuccess(final List<SendResponse> responses) {
        return (int) responses.stream().filter(SendResponse::isSuccessful).count();
    }

    private List<String> findInvalidTokens(final List<String> tokens, final List<SendResponse> responses) {
        return findTokens(tokens, responses, INVALID_TOKEN_ERRORS);
    }

    /**
     * 실패했고 오류 코드가 주어진 코드 중 하나인 응답의 토큰을 찾는다. 응답은 토큰과 같은 순서다.
     */
    private List<String> findTokens(final List<String> tokens, final List<SendResponse> responses, final Set<MessagingErrorCode> errors) {
        List<String> found = new ArrayList<>();
        for (int index = 0; index < responses.size(); index++) {
            SendResponse response = responses.get(index);
            FirebaseMessagingException exception = response.isSuccessful() ? null : response.getException();
            if (exception != null && errors.contains(exception.getMessagingErrorCode())) {
                found.add(tokens.get(index));
            }
        }
        return found;
    }
}

package com.gachi.gacha.server.notification.infra;

import com.gachi.gacha.server.notification.application.PushMessage;
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
import java.util.List;
import java.util.Set;
import java.util.stream.IntStream;
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

    private final FirebaseMessaging firebaseMessaging;

    @Override
    public List<String> send(final List<String> tokens, final PushMessage message) {
        try {
            BatchResponse response = firebaseMessaging.sendEachForMulticast(toMulticastMessage(tokens, message));
            return findInvalidTokens(tokens, response.getResponses());
        } catch (FirebaseMessagingException e) {
            log.error("FCM 푸시 발송 실패. tokenCount = {}", tokens.size(), e);
            return List.of();
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

    private List<String> findInvalidTokens(final List<String> tokens, final List<SendResponse> responses) {
        return IntStream.range(0, responses.size())
                .filter(index -> isInvalidToken(responses.get(index)))
                .mapToObj(tokens::get)
                .toList();
    }

    private boolean isInvalidToken(final SendResponse response) {
        if (response.isSuccessful()) {
            return false;
        }
        FirebaseMessagingException exception = response.getException();
        return exception != null && INVALID_TOKEN_ERRORS.contains(exception.getMessagingErrorCode());
    }
}

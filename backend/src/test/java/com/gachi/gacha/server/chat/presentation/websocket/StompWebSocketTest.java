package com.gachi.gacha.server.chat.presentation.websocket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTCreator;
import com.auth0.jwt.algorithms.Algorithm;
import com.gachi.gacha.server.chat.application.ChatMessageService;
import com.gachi.gacha.server.chat.application.ChatRoomService;
import com.gachi.gacha.server.chat.application.dto.ChatMessageInfo;
import com.gachi.gacha.server.chat.domain.MessageType;
import com.gachi.gacha.server.chat.domain.exception.ChatRoomAccessDeniedException;
import com.gachi.gacha.server.common.auth.jwt.JwtProperty;
import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.common.exception.ErrorCode;
import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.converter.StringMessageConverter;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class StompWebSocketTest {

    private static final long TIMEOUT_SECONDS = 10;
    private static final Long MEMBER_ID = 2L;
    private static final Long NOT_JOINED_ROOM_ID = 5L;
    private static final String UNAUTHORIZED_CODE = "CE005";
    private static final String ACCESS_DENIED_CODE = "CHE005";

    @LocalServerPort
    private int port;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private JwtProperty jwtProperty;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MockitoBean
    private ChatRoomService chatRoomService;

    @MockitoBean
    private ChatMessageService chatMessageService;

    private WebSocketStompClient stompClient;

    @BeforeEach
    void setUp() {
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        stompClient.setMessageConverter(new AnyContentTypeStringMessageConverter());
        stompClient.setDefaultHeartbeat(new long[]{0, 0});

        doThrow(new ChatRoomAccessDeniedException(ErrorCode.CHAT_ROOM_ACCESS_DENIED))
                .when(chatRoomService).validateMember(NOT_JOINED_ROOM_ID, MEMBER_ID);
    }

    @AfterEach
    void tearDown() {
        stompClient.stop();
    }

    @Nested
    @DisplayName("CONNECT 인증")
    class Connect {

        @Test
        @DisplayName("유효한 토큰이면 연결에 성공한다")
        void connect_success() throws Exception {
            StompSession session = connectAsMember();

            assertThat(session.isConnected()).isTrue();
        }

        @Test
        @DisplayName("Authorization 헤더가 없으면 CE005로 연결을 거부한다")
        void connect_withoutAuthorization() throws Exception {
            assertRejected(connect(null), UNAUTHORIZED_CODE);
        }

        @Test
        @DisplayName("Bearer 접두사가 없으면 CE005로 연결을 거부한다")
        void connect_withoutBearerPrefix() throws Exception {
            assertRejected(connect(jwtProvider.createToken(MEMBER_ID)), UNAUTHORIZED_CODE);
        }

        @Test
        @DisplayName("서명이 올바르지 않은 토큰이면 CE005로 연결을 거부한다")
        void connect_withWrongSignature() throws Exception {
            String token = signToken("wrong-secret-key-for-test", MEMBER_ID, 3600);

            assertRejected(connect(bearer(token)), UNAUTHORIZED_CODE);
        }

        @Test
        @DisplayName("만료된 토큰이면 CE005로 연결을 거부한다")
        void connect_withExpiredToken() throws Exception {
            String token = signToken(jwtProperty.secretKey(), MEMBER_ID, -3600);

            assertRejected(connect(bearer(token)), UNAUTHORIZED_CODE);
        }

        @Test
        @DisplayName("memberId claim이 없는 토큰이면 CE005로 연결을 거부한다")
        void connect_withoutMemberIdClaim() throws Exception {
            String token = signToken(jwtProperty.secretKey(), null, 3600);

            assertRejected(connect(bearer(token)), UNAUTHORIZED_CODE);
        }
    }

    @Nested
    @DisplayName("SUBSCRIBE 권한")
    class Subscribe {

        @Test
        @DisplayName("참여 중인 채팅방을 구독하면 발행된 메시지를 받는다")
        void subscribe_joinedRoom() throws Exception {
            String destination = "/topic/chat/rooms/1/messages";
            StompSession session = connectAsMember();
            CompletableFuture<String> received = subscribe(session, destination);

            String payload = awaitDelivery(received, () -> messagingTemplate.convertAndSend(destination, "hello"));

            assertThat(payload).isEqualTo("hello");
        }

        @Test
        @DisplayName("개인 오류 채널을 구독하면 본인에게 보낸 메시지를 받는다")
        void subscribe_personalErrorQueue() throws Exception {
            StompSession session = connectAsMember();
            CompletableFuture<String> received = subscribe(session, "/user/queue/chat/errors");

            String payload = awaitDelivery(received, () -> messagingTemplate.convertAndSendToUser(
                    String.valueOf(MEMBER_ID), "/queue/chat/errors", "error"));

            assertThat(payload).isEqualTo("error");
        }

        @Test
        @DisplayName("참여하지 않은 채팅방을 구독하면 CHE005로 거부한다")
        void subscribe_notJoinedRoom() throws Exception {
            TestSessionHandler handler = connectAsMemberHandler();
            subscribe(awaitConnected(handler), "/topic/chat/rooms/" + NOT_JOINED_ROOM_ID + "/messages");

            assertRejected(handler, ACCESS_DENIED_CODE);
            verify(chatRoomService).validateMember(NOT_JOINED_ROOM_ID, MEMBER_ID);
        }

        @ParameterizedTest(name = "{0}")
        @ValueSource(strings = {"/topic/chat/rooms/abc/messages", "/topic/test", "/topic/chat/rooms/1/other"})
        @DisplayName("허용되지 않은 목적지를 구독하면 참여자 확인 없이 CHE005로 거부한다")
        void subscribe_notAllowedDestination(final String destination) throws Exception {
            TestSessionHandler handler = connectAsMemberHandler();
            subscribe(awaitConnected(handler), destination);

            assertRejected(handler, ACCESS_DENIED_CODE);
            verify(chatRoomService, never()).validateMember(any(), any());
        }
    }

    @Nested
    @DisplayName("SEND 목적지")
    class Send {

        @Test
        @DisplayName("브로커 목적지(/topic)로 직접 전송하면 CHE005로 거부한다")
        void send_toBrokerDestination() throws Exception {
            TestSessionHandler handler = connectAsMemberHandler();
            awaitConnected(handler).send("/topic/chat/rooms/1/messages", "fake");

            assertRejected(handler, ACCESS_DENIED_CODE);
        }

        @Test
        @DisplayName("애플리케이션 목적지(/app)로 전송하면 저장 후 채팅방 구독자에게 발행한다")
        void send_toApplicationDestination() throws Exception {
            given(chatMessageService.sendMessage(eq(MEMBER_ID), eq(1L), any()))
                    .willReturn(textMessageInfo());
            StompSession session = connectAsMember();
            CompletableFuture<String> received = subscribe(session, "/topic/chat/rooms/1/messages");

            String payload = awaitDelivery(received, () -> sendTextMessage(session));

            assertThat(payload).contains("\"sequence\":11").contains("\"content\":\"안녕하세요\"");
            assertThat(session.isConnected()).isTrue();
        }

        @Test
        @DisplayName("전송 처리에 실패하면 개인 오류 채널로 알리고 연결은 유지한다")
        void send_failure() throws Exception {
            given(chatMessageService.sendMessage(eq(MEMBER_ID), eq(1L), any()))
                    .willThrow(new ChatRoomAccessDeniedException(ErrorCode.CHAT_ROOM_ACCESS_DENIED));
            StompSession session = connectAsMember();
            CompletableFuture<String> received = subscribe(session, "/user/queue/chat/errors");

            String payload = awaitDelivery(received, () -> sendTextMessage(session));

            assertThat(payload).contains("\"code\":\"" + ACCESS_DENIED_CODE + "\"");
            assertThat(session.isConnected()).isTrue();
        }

        private void sendTextMessage(final StompSession session) {
            StompHeaders headers = new StompHeaders();
            headers.setDestination("/app/chat/rooms/1/messages");
            headers.setContentType(MimeTypeUtils.APPLICATION_JSON);
            session.send(headers, "{\"type\":\"TEXT\",\"content\":\"안녕하세요\",\"files\":[]}");
        }

        private ChatMessageInfo textMessageInfo() {
            return ChatMessageInfo.builder()
                    .messageId("68c7ea86f3dd2a2fa8123456")
                    .sequence(11L)
                    .roomId(1L)
                    .senderId(MEMBER_ID)
                    .type(MessageType.TEXT)
                    .content("안녕하세요")
                    .files(List.of())
                    .createdAt(LocalDateTime.now())
                    .build();
        }
    }

    private StompSession connectAsMember() throws Exception {
        return awaitConnected(connectAsMemberHandler());
    }

    private TestSessionHandler connectAsMemberHandler() {
        return connect(bearer(jwtProvider.createToken(MEMBER_ID)));
    }

    private TestSessionHandler connect(@Nullable final String authorization) {
        StompHeaders connectHeaders = new StompHeaders();
        if (authorization != null) {
            connectHeaders.add("Authorization", authorization);
        }
        TestSessionHandler handler = new TestSessionHandler();
        stompClient.connectAsync(url(), new WebSocketHttpHeaders(), connectHeaders, handler);
        return handler;
    }

    private StompSession awaitConnected(final TestSessionHandler handler) throws Exception {
        return handler.connected.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
    }

    private void assertRejected(final TestSessionHandler handler, final String expectedCode) throws Exception {
        ErrorFrame error = handler.error.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

        assertThat(error.code()).isEqualTo(expectedCode);
        assertThat(error.body()).contains("\"code\":\"" + expectedCode + "\"");
    }

    private CompletableFuture<String> subscribe(final StompSession session, final String destination) {
        CompletableFuture<String> received = new CompletableFuture<>();
        session.subscribe(destination, new StringFrameHandler(received));
        return received;
    }

    private String awaitDelivery(final CompletableFuture<String> received, final Runnable publish) throws Exception {
        long deadline = System.currentTimeMillis() + TimeUnit.SECONDS.toMillis(TIMEOUT_SECONDS);
        while (System.currentTimeMillis() < deadline) {
            publish.run();
            try {
                return received.get(100, TimeUnit.MILLISECONDS);
            } catch (TimeoutException ignored) {
                // 구독 등록 전에 발행되어 유실되었을 수 있으므로 다시 발행한다.
            }
        }
        throw new AssertionError("구독한 목적지로 메시지가 전달되지 않았습니다.");
    }

    private String signToken(final String secret, @Nullable final Long memberId, final long expiresInSeconds) {
        JWTCreator.Builder builder = JWT.create()
                .withIssuedAt(new Date(System.currentTimeMillis() - 7_200_000))
                .withExpiresAt(new Date(System.currentTimeMillis() + expiresInSeconds * 1000));
        if (memberId != null) {
            builder.withClaim("memberId", memberId);
        }
        return builder.sign(Algorithm.HMAC256(secret));
    }

    private String bearer(final String token) {
        return "Bearer " + token;
    }

    private String url() {
        return "ws://localhost:" + port + "/api/v1/ws";
    }

    private static class TestSessionHandler extends StompSessionHandlerAdapter {

        private final CompletableFuture<StompSession> connected = new CompletableFuture<>();
        private final CompletableFuture<ErrorFrame> error = new CompletableFuture<>();

        @Override
        public void afterConnected(final StompSession session, final StompHeaders connectedHeaders) {
            connected.complete(session);
        }

        @Override
        public Type getPayloadType(final StompHeaders headers) {
            return String.class;
        }

        @Override
        public void handleFrame(final StompHeaders headers, @Nullable final Object payload) {
            error.complete(new ErrorFrame(headers.getFirst("message"), (String) payload));
        }

        @Override
        public void handleTransportError(final StompSession session, final Throwable exception) {
            connected.completeExceptionally(exception);
            error.completeExceptionally(
                    new IllegalStateException("ERROR 프레임을 받기 전에 연결이 종료되었습니다.", exception));
        }
    }

    private record ErrorFrame(String code, @Nullable String body) {
    }

    private record StringFrameHandler(CompletableFuture<String> received) implements StompFrameHandler {

        @Override
        public Type getPayloadType(final StompHeaders headers) {
            return String.class;
        }

        @Override
        public void handleFrame(final StompHeaders headers, @Nullable final Object payload) {
            received.complete((String) payload);
        }
    }

    /**
     * ERROR 프레임 본문은 application/json 이라 기본 StringMessageConverter(text/plain 전용)로는 읽지 못한다.
     * 테스트에서는 본문을 문자열로 검증하기 위해 content-type과 무관하게 문자열로 변환한다.
     */
    private static class AnyContentTypeStringMessageConverter extends StringMessageConverter {

        @Override
        protected boolean supportsMimeType(@Nullable final MessageHeaders headers) {
            return true;
        }
    }
}

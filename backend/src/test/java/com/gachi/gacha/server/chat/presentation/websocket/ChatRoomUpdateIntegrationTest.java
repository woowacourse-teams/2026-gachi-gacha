package com.gachi.gacha.server.chat.presentation.websocket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gachi.gacha.server.chat.application.ChatMessageService;
import com.gachi.gacha.server.chat.application.ChatRoomService;
import com.gachi.gacha.server.chat.application.dto.ChatMessageInfo;
import com.gachi.gacha.server.chat.application.dto.ChatMessageSendCommand;
import com.gachi.gacha.server.chat.application.dto.ChatRoomUpdateInfo;
import com.gachi.gacha.server.chat.domain.ChatMessage;
import com.gachi.gacha.server.chat.domain.ChatMessageMongoRepository;
import com.gachi.gacha.server.chat.domain.ChatRoom;
import com.gachi.gacha.server.chat.domain.ChatRoomJpaRepository;
import com.gachi.gacha.server.chat.domain.ChatRoomMember;
import com.gachi.gacha.server.chat.domain.ChatRoomMemberJpaRepository;
import com.gachi.gacha.server.chat.domain.MessageType;
import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import jakarta.persistence.EntityManager;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicBoolean;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.converter.StringMessageConverter;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

/**
 * 테스트 자체에는 트랜잭션을 적용하지 않는다.
 * 실제 서비스 커밋 이후의 WebSocket 수신과 REST 재조회 결과를 함께 검증한다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ChatRoomUpdateIntegrationTest {

    private static final long TIMEOUT_SECONDS = 10;
    private static final long NO_UPDATE_TIMEOUT_MILLIS = 500;
    private static final String ROOMS_DESTINATION = "/user/queue/chat/rooms";
    private static final String ERRORS_DESTINATION = "/user/queue/chat/errors";
    private static final String SUBSCRIPTION_READY = "subscription-ready";
    private static final String MESSAGE_CONTENT = "오늘 교환 가능할까요?";
    private static final String TRADE_TITLE = "채팅방 갱신 테스트 게시글";

    @LocalServerPort
    private int port;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private ChatMessageService chatMessageService;

    @MockitoSpyBean
    private ChatRoomService chatRoomService;

    @MockitoSpyBean
    private ChatRoomUpdateSender chatRoomUpdateSender;

    @Autowired
    private ChatRoomJpaRepository chatRoomJpaRepository;

    @Autowired
    private ChatRoomMemberJpaRepository chatRoomMemberJpaRepository;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private TradeJpaRepository tradeJpaRepository;

    @MockitoSpyBean
    private ChatMessageMongoRepository chatMessageMongoRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private EntityManager entityManager;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final List<Long> roomIds = new ArrayList<>();
    private final List<Long> tradeIds = new ArrayList<>();
    private final List<Long> memberIds = new ArrayList<>();

    private WebSocketStompClient stompClient;
    private Long ownerId;
    private Long requesterId;
    private Long outsiderId;
    private Long tradeId;
    private Long roomId;

    @BeforeEach
    void setUp() {
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        stompClient.setMessageConverter(new AnyContentTypeStringMessageConverter());
        stompClient.setDefaultHeartbeat(new long[]{0, 0});

        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            Member owner = memberJpaRepository.save(createMember("owner"));
            Member requester = memberJpaRepository.save(createMember("requester"));
            Member outsider = memberJpaRepository.save(createMember("outsider"));
            ownerId = owner.getId();
            requesterId = requester.getId();
            outsiderId = outsider.getId();
            memberIds.addAll(List.of(ownerId, requesterId, outsiderId));

            Trade trade = tradeJpaRepository.save(createTrade(owner));
            tradeId = trade.getId();
            tradeIds.add(tradeId);

            ChatRoom room = chatRoomJpaRepository.save(ChatRoom.create(tradeId, requesterId));
            roomId = room.getId();
            roomIds.add(roomId);
            chatRoomMemberJpaRepository.saveAll(List.of(
                    ChatRoomMember.join(room, owner),
                    ChatRoomMember.join(room, requester)
            ));
        });
    }

    @AfterEach
    void tearDown() {
        stompClient.stop();
        reset(chatRoomService);
        reset(chatRoomUpdateSender);
        reset(chatMessageMongoRepository);
        for (Long id : roomIds) {
            chatMessageMongoRepository.deleteAll(chatMessageMongoRepository.findByRoomIdOrderBySequenceDesc(
                    id, PageRequest.of(0, 100)));
        }

        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            if (!roomIds.isEmpty()) {
                entityManager.createQuery("DELETE FROM ChatRoomMember m WHERE m.chatRoom.id IN :roomIds")
                        .setParameter("roomIds", roomIds)
                        .executeUpdate();
                chatRoomJpaRepository.deleteAllByIdInBatch(roomIds);
            }
            tradeJpaRepository.deleteAllByIdInBatch(tradeIds);
            memberJpaRepository.deleteAllByIdInBatch(memberIds);
        });
    }

    @Test
    @DisplayName("채팅방 메시지 topic 구독 없이도 발송자와 상대방이 각자의 목록과 전체 안 읽은 수를 받는다")
    void sendMessage_updatesBothParticipantsWithoutRoomTopicSubscription() throws Exception {
        Long otherRoomId = chatRoomService.createRoom(outsiderId, tradeId).roomId();
        roomIds.add(otherRoomId);
        chatMessageService.sendMessage(outsiderId, otherRoomId, textCommand());
        StompSession requester = connect(requesterId);
        BlockingQueue<String> requesterUpdates = subscribe(requester, requesterId, ROOMS_DESTINATION);
        BlockingQueue<String> ownerUpdates = subscribe(connect(ownerId), ownerId, ROOMS_DESTINATION);

        sendTextMessage(requester);

        JsonNode requesterUpdate = awaitPayload(requesterUpdates);
        JsonNode ownerUpdate = awaitPayload(ownerUpdates);
        assertRoomUpdate(requesterUpdate, ownerId, 0L, 0L);
        assertRoomUpdate(ownerUpdate, requesterId, 1L, 2L);
        assertThat(ownerUpdate.path("room").path("trade").path("tradeId").asLong()).isEqualTo(tradeId);
        assertThat(ownerUpdate.path("room").path("trade").path("title").asText()).isEqualTo(TRADE_TITLE);
        assertThat(ownerUpdate.path("room").path("lastMessage").path("preview").asText())
                .isEqualTo(MESSAGE_CONTENT);
        assertThat(ownerUpdate.path("room").path("lastMessage").path("sendAt").asText()).isNotEmpty();
        assertThat(ownerUpdate.path("room").path("createdAt").asText()).isNotEmpty();
        assertThat(chatRoomService.getRoomUpdate(ownerId, roomId).totalUnreadCount()).isEqualTo(2L);
        assertThat(chatRoomService.getRoomUpdate(requesterId, roomId).room().unreadCount()).isZero();
        assertThat(chatMessageMongoRepository.findByRoomIdOrderBySequenceDesc(roomId, PageRequest.of(0, 10)))
                .hasSize(1);
    }

    @Test
    @DisplayName("동시에 본인 메시지를 발송해도 sequence가 중복되지 않고 발신자의 메시지는 안 읽은 수에 포함되지 않는다")
    void sendMessage_concurrentOwnMessagesRemainRead() throws Exception {
        int messageCount = 4;
        BlockingQueue<String> requesterUpdates = subscribe(connect(requesterId), requesterId, ROOMS_DESTINATION);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<ChatMessageInfo>> sends = new ArrayList<>();
        List<Long> sequences = new ArrayList<>();

        try (ExecutorService executor = Executors.newFixedThreadPool(messageCount)) {
            for (int i = 0; i < messageCount; i++) {
                sends.add(executor.submit(() -> {
                    awaitLatch(start, "동시 발송 시작 신호");
                    ChatMessageInfo message = chatMessageService.sendMessage(requesterId, roomId, textCommand());
                    chatRoomUpdateSender.sendToRoomMembers(roomId);
                    return message;
                }));
            }
            start.countDown();
            for (Future<ChatMessageInfo> send : sends) {
                sequences.add(send.get(TIMEOUT_SECONDS, TimeUnit.SECONDS).sequence());
            }
        }

        assertThat(sequences).containsExactlyInAnyOrder(1L, 2L, 3L, 4L);
        for (int i = 0; i < messageCount; i++) {
            assertRoomUpdate(awaitPayload(requesterUpdates), ownerId, 0L, 0L);
        }
        assertThat(chatRoomService.getRoomUpdate(requesterId, roomId).room().unreadCount()).isZero();
        assertThat(chatRoomService.getRoomUpdate(ownerId, roomId).room().unreadCount()).isEqualTo(messageCount);
        assertThat(chatMessageMongoRepository.findByRoomIdOrderBySequenceDesc(roomId, PageRequest.of(0, 10)))
                .extracting(ChatMessage::getSequence)
                .containsExactly(4L, 3L, 2L, 1L);
    }

    @ParameterizedTest(name = "{0}")
    @EnumSource(ConcurrentReadRoom.class)
    @DisplayName("읽음 처리 이후 지연된 발송 갱신이 도착해도 안 읽은 수가 과거 상태로 돌아가지 않는다")
    void concurrentSendAndRead_doesNotRestoreUnreadCountAfterRead(final ConcurrentReadRoom scope) throws Exception {
        Long readRoomId;
        if (scope == ConcurrentReadRoom.OTHER_ROOM) {
            readRoomId = chatRoomService.createRoom(outsiderId, tradeId).roomId();
            roomIds.add(readRoomId);
            chatMessageService.sendMessage(outsiderId, readRoomId, textCommand());
        } else {
            readRoomId = roomId;
            chatMessageService.sendMessage(requesterId, roomId, textCommand());
        }
        BlockingQueue<String> ownerUpdates = subscribe(connect(ownerId), ownerId, ROOMS_DESTINATION);
        CountDownLatch unreadSnapshotCaptured = new CountDownLatch(1);
        CountDownLatch releaseUnreadSnapshot = new CountDownLatch(1);
        CountDownLatch readUpdateAttempted = new CountDownLatch(1);
        AtomicBoolean delayFirstSnapshot = new AtomicBoolean(true);

        // 실제 DB에서 조회한 첫 갱신만 지연시켜, 읽음 갱신과의 순서 역전을 재현한다.
        doAnswer(invocation -> {
            ChatRoomUpdateInfo snapshot = (ChatRoomUpdateInfo) invocation.callRealMethod();
            if (delayFirstSnapshot.compareAndSet(true, false)) {
                unreadSnapshotCaptured.countDown();
                awaitLatch(releaseUnreadSnapshot, "읽음 처리 이후 과거 갱신 전송 재개 신호");
            }
            return snapshot;
        }).when(chatRoomService).getRoomUpdate(eq(ownerId), eq(roomId));

        doAnswer(invocation -> {
            if (!delayFirstSnapshot.get()) {
                // REST 서비스가 반환된 뒤 호출되므로 이 시점에는 읽음 상태가 커밋되어 있다.
                readUpdateAttempted.countDown();
            }
            return invocation.callRealMethod();
        }).when(chatRoomUpdateSender).sendToMember(eq(ownerId), any(Long.class));

        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            Future<?> delayedUpdate = executor.submit(() -> chatRoomUpdateSender.sendToRoomMembers(roomId));
            Future<Response> readRequest = null;
            try {
                awaitLatch(unreadSnapshotCaptured, "전체 안 읽은 수 1의 갱신 조회 완료 신호");
                readRequest = executor.submit(() -> readMessages(ownerId, readRoomId, 1L));
                awaitLatch(readUpdateAttempted, "읽음 처리 커밋 이후 갱신 전송 시작 신호");
                try {
                    readRequest.get(NO_UPDATE_TIMEOUT_MILLIS, TimeUnit.MILLISECONDS).then().statusCode(200);
                } catch (TimeoutException ignored) {
                    // 직렬화된 갱신은 첫 조회의 전송이 끝날 때까지 대기할 수 있다.
                }

                releaseUnreadSnapshot.countDown();
                delayedUpdate.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
                readRequest.get(TIMEOUT_SECONDS, TimeUnit.SECONDS).then().statusCode(200);
                awaitPayload(ownerUpdates);
                JsonNode lastReceivedUpdate = awaitPayload(ownerUpdates);
                ChatRoomUpdateInfo latest = chatRoomService.getRoomUpdate(
                        ownerId, lastReceivedUpdate.path("room").path("roomId").asLong());

                assertThat(latest.room().unreadCount()).isZero();
                assertThat(lastReceivedUpdate.path("room").path("unreadCount").asLong())
                        .as("읽음 처리 이후 마지막으로 수신한 안 읽은 수는 DB의 최신 읽음 상태와 일치해야 한다")
                        .isEqualTo(latest.room().unreadCount());
                assertThat(lastReceivedUpdate.path("totalUnreadCount").asLong())
                        .isEqualTo(latest.totalUnreadCount());
            } finally {
                releaseUnreadSnapshot.countDown();
                delayedUpdate.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
                if (readRequest != null) {
                    readRequest.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
                }
            }
        }
    }

    @Test
    @DisplayName("읽음 처리 후 읽은 사용자에게만 갱신되며 재접속하여 REST로 조회해도 읽음 상태가 유지된다")
    void readMessages_updatesOnlyReaderAndPersistsAfterReconnect() throws Exception {
        chatMessageService.sendMessage(requesterId, roomId, textCommand());
        StompSession owner = connect(ownerId);
        BlockingQueue<String> ownerUpdates = subscribe(owner, ownerId, ROOMS_DESTINATION);
        BlockingQueue<String> requesterUpdates = subscribe(connect(requesterId), requesterId, ROOMS_DESTINATION);

        readMessages(ownerId, 1L).then().statusCode(200);

        assertRoomUpdate(awaitPayload(ownerUpdates), requesterId, 0L, 0L);
        assertNoUpdate(requesterUpdates);
        owner.disconnect();
        BlockingQueue<String> reconnectedUpdates = subscribe(connect(ownerId), ownerId, ROOMS_DESTINATION);
        Response roomResponse = RestAssured.given()
                .port(port)
                .header("Authorization", bearer(ownerId))
                .get("/api/v1/chat/rooms/" + roomId);
        roomResponse.then().statusCode(200);
        assertThat(roomResponse.jsonPath().getLong("data.unreadCount")).isZero();
        Response unreadResponse = RestAssured.given()
                .port(port)
                .header("Authorization", bearer(ownerId))
                .get("/api/v1/chat/rooms/unread-count");
        unreadResponse.then().statusCode(200);
        assertThat(unreadResponse.jsonPath().getLong("data.unreadCount")).isZero();
        assertNoUpdate(reconnectedUpdates);
    }

    @Test
    @DisplayName("일부 메시지만 읽으면 남은 메시지 수를 전달하고 과거 sequence로 요청해도 읽음 상태가 후퇴하지 않는다")
    void readMessages_partialAndRepeatedReadsKeepCorrectUnreadCount() throws Exception {
        for (int i = 0; i < 3; i++) {
            chatMessageService.sendMessage(requesterId, roomId, textCommand());
        }
        BlockingQueue<String> updates = subscribe(connect(ownerId), ownerId, ROOMS_DESTINATION);

        readMessages(ownerId, 1L).then().statusCode(200);
        assertRoomUpdate(awaitPayload(updates), requesterId, 2L, 2L);
        readMessages(ownerId, 0L).then().statusCode(200);
        assertRoomUpdate(awaitPayload(updates), requesterId, 2L, 2L);

        assertThat(chatRoomService.getRoomUpdate(ownerId, roomId).room().unreadCount()).isEqualTo(2L);
    }

    @Test
    @DisplayName("잘못된 읽음 sequence는 400으로 거부하고 읽음 상태를 변경하거나 갱신 정보를 보내지 않는다")
    void readMessages_invalidSequenceDoesNotPublish() throws Exception {
        chatMessageService.sendMessage(requesterId, roomId, textCommand());
        BlockingQueue<String> updates = subscribe(connect(ownerId), ownerId, ROOMS_DESTINATION);

        readMessages(ownerId, 2L).then().statusCode(400);

        assertNoUpdate(updates);
        assertThat(chatRoomService.getRoomUpdate(ownerId, roomId).room().unreadCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("비참여자의 읽음 요청은 403으로 거부하고 개인 목록 갱신도 보내지 않는다")
    void readMessages_nonParticipantDoesNotPublish() throws Exception {
        chatMessageService.sendMessage(requesterId, roomId, textCommand());
        BlockingQueue<String> updates = subscribe(connect(outsiderId), outsiderId, ROOMS_DESTINATION);

        readMessages(outsiderId, 1L).then().statusCode(403);

        assertNoUpdate(updates);
        assertThat(chatRoomService.getRoomUpdate(ownerId, roomId).room().unreadCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("채팅방 생성 API 성공 시 양쪽 참여자에게 마지막 메시지가 없는 새 채팅방 정보를 보낸다")
    void createRoom_publishesNewRoomToBothParticipants() throws Exception {
        Long newTradeId = new TransactionTemplate(transactionManager).execute(status -> {
            Member owner = memberJpaRepository.getMemberById(ownerId);
            Trade trade = tradeJpaRepository.save(createTrade(owner));
            tradeIds.add(trade.getId());
            return trade.getId();
        });
        BlockingQueue<String> ownerUpdates = subscribe(connect(ownerId), ownerId, ROOMS_DESTINATION);
        BlockingQueue<String> requesterUpdates = subscribe(connect(requesterId), requesterId, ROOMS_DESTINATION);

        Response response = createRoom(newTradeId);
        response.then().statusCode(201);
        Long newRoomId = response.jsonPath().getLong("data.roomId");
        roomIds.add(newRoomId);

        for (JsonNode update : List.of(awaitPayload(ownerUpdates), awaitPayload(requesterUpdates))) {
            assertThat(update.path("room").path("roomId").asLong()).isEqualTo(newRoomId);
            assertThat(update.path("room").path("trade").path("tradeId").asLong()).isEqualTo(newTradeId);
            assertThat(update.path("room").path("lastMessage").isNull()).isTrue();
            assertThat(update.path("room").path("unreadCount").asLong()).isZero();
            assertThat(update.path("totalUnreadCount").asLong()).isZero();
        }
        assertThat(chatRoomService.getMemberIds(newRoomId))
                .containsExactlyInAnyOrder(ownerId, requesterId);
    }

    @Test
    @DisplayName("중복 채팅방 생성이 실패하면 어느 참여자에게도 갱신 정보를 보내지 않는다")
    void createRoom_duplicateDoesNotPublish() throws Exception {
        BlockingQueue<String> ownerUpdates = subscribe(connect(ownerId), ownerId, ROOMS_DESTINATION);
        BlockingQueue<String> requesterUpdates = subscribe(connect(requesterId), requesterId, ROOMS_DESTINATION);

        createRoom(tradeId).then().statusCode(409);

        assertNoUpdate(ownerUpdates);
        assertNoUpdate(requesterUpdates);
        assertThat(chatRoomService.getRooms(requesterId)).hasSize(1);
    }

    @Test
    @DisplayName("개인 목록 채널을 구독한 다른 사용자는 무관한 채팅방의 갱신 정보를 받지 않는다")
    void sendMessage_unrelatedUserDoesNotReceiveUpdate() throws Exception {
        StompSession requester = connect(requesterId);
        BlockingQueue<String> requesterUpdates = subscribe(requester, requesterId, ROOMS_DESTINATION);
        BlockingQueue<String> outsiderUpdates = subscribe(connect(outsiderId), outsiderId, ROOMS_DESTINATION);

        sendTextMessage(requester);

        assertRoomUpdate(awaitPayload(requesterUpdates), ownerId, 0L, 0L);
        assertNoUpdate(outsiderUpdates);
    }

    @Test
    @DisplayName("같은 사용자가 두 연결에서 개인 목록을 구독하면 두 연결 모두 갱신 정보를 받는다")
    void sendMessage_allSessionsOfSameUserReceiveUpdate() throws Exception {
        BlockingQueue<String> firstUpdates = subscribe(connect(ownerId), ownerId, ROOMS_DESTINATION);
        BlockingQueue<String> secondUpdates = subscribe(connect(ownerId), ownerId, ROOMS_DESTINATION);
        StompSession requester = connect(requesterId);

        sendTextMessage(requester);

        JsonNode first = awaitPayload(firstUpdates);
        JsonNode second = awaitPayload(secondUpdates);
        assertRoomUpdate(first, requesterId, 1L, 1L);
        assertThat(second).isEqualTo(first);
    }

    @ParameterizedTest(name = "{0}")
    @EnumSource(MessageFailure.class)
    @DisplayName("메시지 저장 또는 최종 커밋이 실패하면 DB를 롤백하고 목록 갱신을 보내지 않는다")
    void sendMessage_failureRollsBackAndDoesNotPublish(final MessageFailure failure) throws Exception {
        StompSession requester = connect(requesterId);
        BlockingQueue<String> requesterUpdates = subscribe(requester, requesterId, ROOMS_DESTINATION);
        BlockingQueue<String> ownerUpdates = subscribe(connect(ownerId), ownerId, ROOMS_DESTINATION);
        BlockingQueue<String> errors = subscribe(requester, requesterId, ERRORS_DESTINATION);
        failMessageAt(failure);

        sendTextMessage(requester);

        assertThat(awaitPayload(errors).path("code").asText()).isEqualTo("CE003");
        assertNoUpdate(requesterUpdates);
        assertNoUpdate(ownerUpdates);
        assertThat(chatRoomJpaRepository.getById(roomId).getLastMessageSequence()).isZero();
        assertThat(chatRoomService.getRoomUpdate(ownerId, roomId).room().lastMessage()).isNull();
        assertThat(chatRoomService.getRoomUpdate(ownerId, roomId).totalUnreadCount()).isZero();
        assertThat(chatMessageMongoRepository.findByRoomIdOrderBySequenceDesc(roomId, PageRequest.of(0, 10)))
                .isEmpty();
        assertThat(requester.isConnected()).isTrue();
    }

    private void failMessageAt(final MessageFailure failure) {
        if (failure == MessageFailure.SAVE) {
            doThrow(new DataAccessResourceFailureException("테스트 메시지 저장 실패"))
                    .when(chatMessageMongoRepository).save(any(ChatMessage.class));
            return;
        }
        doAnswer(invocation -> {
            ChatMessage saved = mongoTemplate.save(invocation.getArgument(0, ChatMessage.class));
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void beforeCommit(final boolean readOnly) {
                    throw new IllegalStateException("테스트 최종 커밋 실패");
                }
            });
            return saved;
        }).when(chatMessageMongoRepository).save(any(ChatMessage.class));
    }

    private Response readMessages(final Long memberId, final long lastReadSequence) {
        return readMessages(memberId, roomId, lastReadSequence);
    }

    private Response readMessages(final Long memberId, final Long targetRoomId, final long lastReadSequence) {
        return RestAssured.given()
                .port(port)
                .header("Authorization", bearer(memberId))
                .contentType(ContentType.JSON)
                .body("{\"lastReadSequence\":" + lastReadSequence + "}")
                .patch("/api/v1/chat/rooms/" + targetRoomId + "/messages/read");
    }

    private Response createRoom(final Long targetTradeId) {
        return RestAssured.given()
                .port(port)
                .header("Authorization", bearer(requesterId))
                .contentType(ContentType.JSON)
                .body("{\"tradeId\":" + targetTradeId + "}")
                .post("/api/v1/chat/rooms");
    }

    private StompSession connect(final Long memberId) throws Exception {
        StompHeaders headers = new StompHeaders();
        headers.set("Authorization", bearer(memberId));
        return stompClient.connectAsync(
                        "ws://localhost:" + port + "/api/v1/ws",
                        new WebSocketHttpHeaders(), headers, new StompSessionHandlerAdapter() {
                        })
                .get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
    }

    private BlockingQueue<String> subscribe(
            final StompSession session, final Long memberId, final String destination
    ) throws Exception {
        BlockingQueue<String> received = new LinkedBlockingQueue<>();
        session.subscribe(destination, new StringFrameHandler(received));

        // 브로커에 구독이 등록됐는지 확인한 다음 상태 변경 요청을 한 번만 보낸다.
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(TIMEOUT_SECONDS);
        while (System.nanoTime() < deadline) {
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(memberId), destination.substring("/user".length()), SUBSCRIPTION_READY);
            if (SUBSCRIPTION_READY.equals(received.poll(100, TimeUnit.MILLISECONDS))) {
                return received;
            }
        }
        throw new AssertionError("개인 목적지 구독이 등록되지 않았습니다: " + destination);
    }

    private void sendTextMessage(final StompSession session) {
        StompHeaders headers = new StompHeaders();
        headers.setDestination("/app/chat/rooms/" + roomId + "/messages");
        headers.setContentType(MimeTypeUtils.APPLICATION_JSON);
        session.send(headers, "{\"type\":\"TEXT\",\"content\":\"" + MESSAGE_CONTENT + "\",\"files\":[]}");
    }

    private JsonNode awaitPayload(final BlockingQueue<String> received) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(TIMEOUT_SECONDS);
        while (System.nanoTime() < deadline) {
            String payload = received.poll(deadline - System.nanoTime(), TimeUnit.NANOSECONDS);
            if (payload == null) {
                break;
            }
            if (!SUBSCRIPTION_READY.equals(payload)) {
                return objectMapper.readTree(payload);
            }
        }
        throw new AssertionError("구독한 목적지로 갱신 정보가 전달되지 않았습니다.");
    }

    private void assertNoUpdate(final BlockingQueue<String> received) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(NO_UPDATE_TIMEOUT_MILLIS);
        while (System.nanoTime() < deadline) {
            String payload = received.poll(deadline - System.nanoTime(), TimeUnit.NANOSECONDS);
            if (payload == null) {
                return;
            }
            assertThat(payload).isEqualTo(SUBSCRIPTION_READY);
        }
    }

    private void assertRoomUpdate(
            final JsonNode update, final Long otherMemberId, final long unreadCount, final long totalUnreadCount
    ) {
        assertThat(update.path("room").path("roomId").asLong()).isEqualTo(roomId);
        assertThat(update.path("room").path("otherMember").path("memberId").asLong()).isEqualTo(otherMemberId);
        assertThat(update.path("room").path("unreadCount").isIntegralNumber()).isTrue();
        assertThat(update.path("room").path("unreadCount").asLong()).isEqualTo(unreadCount);
        assertThat(update.path("totalUnreadCount").isIntegralNumber()).isTrue();
        assertThat(update.path("totalUnreadCount").asLong()).isEqualTo(totalUnreadCount);
    }

    private ChatMessageSendCommand textCommand() {
        return new ChatMessageSendCommand(MessageType.TEXT, MESSAGE_CONTENT, List.of());
    }

    private void awaitLatch(final CountDownLatch latch, final String description) throws InterruptedException {
        assertThat(latch.await(TIMEOUT_SECONDS, TimeUnit.SECONDS)).as(description).isTrue();
    }

    private String bearer(final Long memberId) {
        return "Bearer " + jwtProvider.createToken(memberId);
    }

    private Member createMember(final String nickname) {
        return Member.builder()
                .oauthId(new OauthId(nickname + UUID.randomUUID(), OauthProviderType.KAKAO))
                .oauthUsername(nickname + "-oauth")
                .nickname(nickname)
                .profileImageUrl("https://example.com/profile/" + nickname + ".png")
                .build();
    }

    private Trade createTrade(final Member owner) {
        return Trade.builder().member(owner).title(TRADE_TITLE).build();
    }

    private enum MessageFailure {
        SAVE, COMMIT
    }

    private enum ConcurrentReadRoom {
        SAME_ROOM, OTHER_ROOM
    }

    private record StringFrameHandler(BlockingQueue<String> received) implements StompFrameHandler {

        @Override
        public Type getPayloadType(final StompHeaders headers) {
            return String.class;
        }

        @Override
        public void handleFrame(final StompHeaders headers, @Nullable final Object payload) {
            received.add((String) payload);
        }
    }

    private static class AnyContentTypeStringMessageConverter extends StringMessageConverter {

        @Override
        protected boolean supportsMimeType(@Nullable final MessageHeaders headers) {
            return true;
        }
    }
}

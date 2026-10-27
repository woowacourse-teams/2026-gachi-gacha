package com.gachi.gacha.server.chat.presentation;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.chat.domain.ChatRoom;
import com.gachi.gacha.server.chat.domain.ChatRoomJpaRepository;
import com.gachi.gacha.server.chat.domain.ChatRoomMember;
import com.gachi.gacha.server.chat.domain.ChatRoomMemberJpaRepository;
import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 탈퇴 회원이 포함된 채팅방이 있어도 채팅 API가 정상 동작하는지 실제 HTTP 요청으로 검증한다.
 *
 * <p>요청은 테스트와 다른 스레드에서 처리되므로 테스트 자체에는 트랜잭션을 걸지 않고, 데이터는 직접 만들고 지운다.
 * 탈퇴 회원은 soft delete 되어 JPA 조회에서 제외되므로 정리할 때는 native query 로 지운다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ChatRoomControllerTest {

    private static final String API = "/api/v1";

    @LocalServerPort
    private int port;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private TradeJpaRepository tradeJpaRepository;

    @Autowired
    private ChatRoomJpaRepository chatRoomJpaRepository;

    @Autowired
    private ChatRoomMemberJpaRepository chatRoomMemberJpaRepository;

    private Long withdrawnOwnerId;
    private Long activeOwnerId;
    private Long requesterId;
    private Long newRequesterId;
    private Long withdrawnOwnerTradeId;
    private Long activeOwnerTradeId;
    private Long withdrawnMemberRoomId;
    private Long activeMemberRoomId;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        transactionTemplate.executeWithoutResult(status -> {
            Member withdrawnOwner = memberJpaRepository.save(createMember("withdrawn-owner"));
            Member activeOwner = memberJpaRepository.save(createMember("active-owner"));
            Member requester = memberJpaRepository.save(createMember("requester"));
            Member newRequester = memberJpaRepository.save(createMember("new-requester"));
            withdrawnOwnerId = withdrawnOwner.getId();
            activeOwnerId = activeOwner.getId();
            requesterId = requester.getId();
            newRequesterId = newRequester.getId();

            Trade withdrawnOwnerTrade = tradeJpaRepository.save(createTrade(withdrawnOwner));
            Trade activeOwnerTrade = tradeJpaRepository.save(createTrade(activeOwner));
            withdrawnOwnerTradeId = withdrawnOwnerTrade.getId();
            activeOwnerTradeId = activeOwnerTrade.getId();

            withdrawnMemberRoomId = saveRoom(withdrawnOwnerTrade, withdrawnOwner, requester);
            activeMemberRoomId = saveRoom(activeOwnerTrade, activeOwner, requester);
        });

        transactionTemplate.executeWithoutResult(status ->
                memberJpaRepository.delete(memberJpaRepository.getMemberById(withdrawnOwnerId)));
    }

    @AfterEach
    void tearDown() {
        List<Long> tradeIds = List.of(withdrawnOwnerTradeId, activeOwnerTradeId);
        List<Long> memberIds = List.of(withdrawnOwnerId, activeOwnerId, requesterId, newRequesterId);

        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            entityManager.createQuery("""
                            DELETE FROM ChatRoomMember chatRoomMember
                            WHERE chatRoomMember.chatRoom.id IN (
                                SELECT chatRoom.id FROM ChatRoom chatRoom WHERE chatRoom.tradeId IN :tradeIds
                            )
                            """)
                    .setParameter("tradeIds", tradeIds)
                    .executeUpdate();
            entityManager.createQuery("DELETE FROM ChatRoom chatRoom WHERE chatRoom.tradeId IN :tradeIds")
                    .setParameter("tradeIds", tradeIds)
                    .executeUpdate();
            entityManager.createQuery("DELETE FROM Notification notification WHERE notification.receiverId IN :memberIds")
                    .setParameter("memberIds", memberIds)
                    .executeUpdate();
            tradeJpaRepository.deleteAllByIdInBatch(tradeIds);
            entityManager.createNativeQuery("DELETE FROM member WHERE id IN (:memberIds)")
                    .setParameter("memberIds", memberIds)
                    .executeUpdate();
        });
    }

    @Nested
    @DisplayName("GET /chat/rooms/me - 내 채팅방 목록 조회 API")
    class ReadMyChatRooms {

        @Test
        @DisplayName("탈퇴 회원과의 채팅방이 있어도 200 OK와 함께 전체 목록을 반환하고 탈퇴 상대는 익명화한다.")
        void readMyChatRooms_withWithdrawnMember() {
            // when
            ExtractableResponse<Response> response = request(requesterId)
                    .get(API + "/chat/rooms/me")
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getList("data.rooms.roomId", Long.class))
                    .containsExactlyInAnyOrder(withdrawnMemberRoomId, activeMemberRoomId);

            String withdrawnRoom = "data.rooms.find { it.roomId == " + withdrawnMemberRoomId + " }.otherMember";
            assertThat(response.jsonPath().getString(withdrawnRoom + ".nickname")).isEqualTo("탈퇴한 사용자");
            assertThat(response.jsonPath().getString(withdrawnRoom + ".profileImageUrl")).isNull();
            assertThat(response.jsonPath().getBoolean(withdrawnRoom + ".withdrawn")).isTrue();

            String activeRoom = "data.rooms.find { it.roomId == " + activeMemberRoomId + " }.otherMember";
            assertThat(response.jsonPath().getString(activeRoom + ".nickname")).isEqualTo("active-owner");
            assertThat(response.jsonPath().getBoolean(activeRoom + ".withdrawn")).isFalse();
        }
    }

    @Nested
    @DisplayName("GET /chat/rooms/{roomId} - 채팅방 상세 조회 API")
    class ReadChatRoom {

        @Test
        @DisplayName("상대가 탈퇴한 채팅방도 200 OK와 함께 익명화된 상대 정보를 반환한다.")
        void readChatRoom_withWithdrawnMember() {
            // when
            ExtractableResponse<Response> response = request(requesterId)
                    .get(API + "/chat/rooms/" + withdrawnMemberRoomId)
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getLong("data.otherMember.memberId")).isEqualTo(withdrawnOwnerId);
            assertThat(response.jsonPath().getString("data.otherMember.nickname")).isEqualTo("탈퇴한 사용자");
            assertThat(response.jsonPath().getString("data.otherMember.profileImageUrl")).isNull();
            assertThat(response.jsonPath().getBoolean("data.otherMember.withdrawn")).isTrue();
        }
    }

    @Nested
    @DisplayName("POST /chat/rooms - 채팅방 생성 API")
    class CreateChatRoom {

        @Test
        @DisplayName("탈퇴 회원의 게시글이면 403과 CHE008을 반환하고 채팅방을 만들지 않는다.")
        void createChatRoom_withdrawnTradeOwner() {
            // when
            ExtractableResponse<Response> response = request(newRequesterId)
                    .contentType(ContentType.JSON)
                    .body(Map.of("tradeId", withdrawnOwnerTradeId))
                    .post(API + "/chat/rooms")
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.FORBIDDEN.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("CHE008");
            assertThat(chatRoomJpaRepository.findByTradeIdAndRequesterId(withdrawnOwnerTradeId, newRequesterId))
                    .isEmpty();
        }

        @Test
        @DisplayName("정상 회원의 게시글이면 201 Created를 반환한다.")
        void createChatRoom_activeTradeOwner() {
            // when
            ExtractableResponse<Response> response = request(newRequesterId)
                    .contentType(ContentType.JSON)
                    .body(Map.of("tradeId", activeOwnerTradeId))
                    .post(API + "/chat/rooms")
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.CREATED.value());
            assertThat(chatRoomJpaRepository.findByTradeIdAndRequesterId(activeOwnerTradeId, newRequesterId))
                    .isPresent();
        }
    }

    private RequestSpecification request(final Long memberId) {
        return RestAssured.given().log().ifValidationFails()
                .header("Authorization", "Bearer " + jwtProvider.createToken(memberId))
                .when();
    }

    private Long saveRoom(final Trade trade, final Member owner, final Member requester) {
        ChatRoom room = chatRoomJpaRepository.save(ChatRoom.create(trade.getId(), requester.getId()));
        chatRoomMemberJpaRepository.saveAll(List.of(
                ChatRoomMember.join(room, owner),
                ChatRoomMember.join(room, requester)
        ));
        return room.getId();
    }

    private Trade createTrade(final Member owner) {
        return Trade.builder()
                .member(owner)
                .title("chat-room-controller-test-" + UUID.randomUUID().toString().substring(0, 8))
                .build();
    }

    private Member createMember(final String nickname) {
        return Member.builder()
                .oauthId(new OauthId(nickname + UUID.randomUUID(), OauthProviderType.KAKAO))
                .oauthUsername(nickname + "-oauth")
                .nickname(nickname)
                .build();
    }
}

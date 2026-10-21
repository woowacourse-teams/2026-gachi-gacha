package com.gachi.gacha.server.common.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.category.domain.Category;
import com.gachi.gacha.server.category.domain.CategoryJpaRepository;
import com.gachi.gacha.server.chat.domain.ChatRoom;
import com.gachi.gacha.server.chat.domain.ChatRoomJpaRepository;
import com.gachi.gacha.server.chat.domain.ChatRoomMember;
import com.gachi.gacha.server.chat.domain.ChatRoomMemberJpaRepository;
import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaCategory;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberBlock;
import com.gachi.gacha.server.member.domain.MemberBlockJpaRepository;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import io.restassured.RestAssured;
import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;
import jakarta.persistence.EntityManager;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewInterceptor;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * OSIV(spring.jpa.open-in-view)를 끈 상태에서 조회 API가 기존과 같은 응답을 주는지 검증하는 회귀 테스트.
 *
 * <p>OSIV를 끄면 영속성 컨텍스트가 서비스 트랜잭션이 끝날 때 닫힌다. 컨트롤러나 응답 변환 단계에서
 * 지연 로딩(연관 엔티티 접근)을 하는 코드가 생기면 LazyInitializationException 으로 500이 난다.
 * 부하 테스트에서 쓰는 조회 API 10개를 실제 HTTP 요청으로 호출해, 지연 로딩이 일어나는 필드
 * (게시글 작성자·카테고리, 가챠 카테고리, 채팅방 상대 회원·게시글)까지 응답에 담기는지 확인한다.
 *
 * <p>새 조회 API를 추가하면 해당 컨트롤러의 @Nested 그룹에 테스트를 함께 추가한다.
 *
 * <p>요청은 테스트와 다른 스레드에서 처리되므로 테스트 자체에는 트랜잭션을 걸지 않고,
 * 데이터는 직접 만들고 지운다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OsivDisabledControllerTest {

    private static final String API = "/api/v1";

    @LocalServerPort
    private int port;

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private MemberBlockJpaRepository memberBlockJpaRepository;

    @Autowired
    private CategoryJpaRepository categoryJpaRepository;

    @Autowired
    private TradeJpaRepository tradeJpaRepository;

    @Autowired
    private GachaJpaRepository gachaJpaRepository;

    @Autowired
    private ChatRoomJpaRepository chatRoomJpaRepository;

    @Autowired
    private ChatRoomMemberJpaRepository chatRoomMemberJpaRepository;

    private final String token = UUID.randomUUID().toString().substring(0, 8);
    private final String categoryName = "osiv-category-" + token;
    private final String tradeTitle = "osiv-trade-" + token;
    private final String gachaName = "osiv-gacha-" + token;

    private final List<Long> memberIds = new ArrayList<>();
    private Long ownerId;
    private Long requesterId;
    private Long categoryId;
    private Long tradeId;
    private Long gachaId;
    private Long roomId;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;

        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            Member owner = memberJpaRepository.save(createMember("owner"));
            Member requester = memberJpaRepository.save(createMember("requester"));
            ownerId = owner.getId();
            requesterId = requester.getId();
            memberIds.addAll(List.of(ownerId, requesterId));

            Category category = categoryJpaRepository.save(new Category(categoryName));
            categoryId = category.getId();

            Trade trade = Trade.builder().member(owner).title(tradeTitle).build();
            trade.replaceCategories(List.of(category));
            tradeId = tradeJpaRepository.save(trade).getId();

            Gacha gacha = Gacha.builder().name(gachaName).build();
            gacha.getGachaCategories().add(new GachaCategory(null, gacha, category));
            gachaId = gachaJpaRepository.save(gacha).getId();

            ChatRoom room = chatRoomJpaRepository.save(ChatRoom.create(tradeId, requesterId));
            roomId = room.getId();
            chatRoomMemberJpaRepository.saveAll(List.of(
                    ChatRoomMember.join(room, owner),
                    ChatRoomMember.join(room, requester)
            ));
        });
    }

    @AfterEach
    void tearDown() {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            if (roomId != null) {
                entityManager.createQuery("DELETE FROM ChatRoomMember m WHERE m.chatRoom.id = :roomId")
                        .setParameter("roomId", roomId)
                        .executeUpdate();
                chatRoomJpaRepository.deleteAllByIdInBatch(List.of(roomId));
            }
            // trade_category, gacha_category 는 DB의 ON DELETE CASCADE 로 함께 지워진다.
            if (tradeId != null) {
                tradeJpaRepository.deleteAllByIdInBatch(List.of(tradeId));
            }
            if (gachaId != null) {
                gachaJpaRepository.deleteAllByIdInBatch(List.of(gachaId));
            }
            if (categoryId != null) {
                categoryJpaRepository.deleteAllByIdInBatch(List.of(categoryId));
            }
            entityManager.createQuery("DELETE FROM MemberBlock b WHERE b.blockerId IN :memberIds")
                    .setParameter("memberIds", memberIds)
                    .executeUpdate();
            memberJpaRepository.deleteAllByIdInBatch(memberIds);
        });
    }

    @Test
    @DisplayName("OSIV 설정이 꺼져 있다 (OpenEntityManagerInViewInterceptor 미등록)")
    void openInViewIsDisabled() {
        assertThat(applicationContext.getBeanNamesForType(OpenEntityManagerInViewInterceptor.class)).isEmpty();
    }

    @Nested
    @DisplayName("CategoryController")
    class CategoryApi {

        @Test
        @DisplayName("GET /categories - 카테고리 목록을 반환한다")
        void readCategories() {
            ExtractableResponse<Response> response = get("/categories?keyword=" + categoryName, null);

            assertOk(response);
            assertThat(response.jsonPath().getList("data.items.name", String.class)).containsExactly(categoryName);
        }
    }

    @Nested
    @DisplayName("GachaController")
    class GachaApi {

        @Test
        @DisplayName("GET /gachas - 지연 로딩되는 가챠 카테고리까지 응답에 담긴다")
        void readGachas() {
            ExtractableResponse<Response> response = get("/gachas?keyword=" + gachaName, null);

            assertOk(response);
            assertThat(response.jsonPath().getLong("data.content[0].gachaId")).isEqualTo(gachaId);
            assertThat(response.jsonPath().getList("data.content[0].categories", String.class))
                    .containsExactly(categoryName);
        }
    }

    @Nested
    @DisplayName("TradeController")
    class TradeApi {

        @Test
        @DisplayName("GET /trades - 지연 로딩되는 작성자와 카테고리까지 응답에 담긴다")
        void readTrades() {
            ExtractableResponse<Response> response = get("/trades?keyword=" + tradeTitle, null);

            assertOk(response);
            assertThat(response.jsonPath().getLong("data.content[0].tradeId")).isEqualTo(tradeId);
            assertThat(response.jsonPath().getLong("data.content[0].memberId")).isEqualTo(ownerId);
            assertThat(response.jsonPath().getList("data.content[0].categories", String.class))
                    .containsExactly(categoryName);
        }

        @Test
        @DisplayName("GET /trades/{tradeId} - 지연 로딩되는 작성자와 카테고리까지 응답에 담긴다")
        void readTrade() {
            ExtractableResponse<Response> response = get("/trades/" + tradeId, null);

            assertOk(response);
            assertThat(response.jsonPath().getLong("data.memberId")).isEqualTo(ownerId);
            assertThat(response.jsonPath().getString("data.title")).isEqualTo(tradeTitle);
            assertThat(response.jsonPath().getList("data.categories", String.class)).containsExactly(categoryName);
        }

        @Test
        @DisplayName("GET /trades/me - 내 게시글 목록에 작성자와 카테고리가 담긴다")
        void readMyTrades() {
            ExtractableResponse<Response> response = get("/trades/me", ownerId);

            assertOk(response);
            assertThat(response.jsonPath().getLong("data.content[0].tradeId")).isEqualTo(tradeId);
            assertThat(response.jsonPath().getList("data.content[0].categories", String.class))
                    .containsExactly(categoryName);
        }
    }

    @Nested
    @DisplayName("ChatRoomController")
    class ChatRoomApi {

        @Test
        @DisplayName("GET /chat/rooms/me - 지연 로딩되는 상대 회원과 게시글까지 응답에 담긴다")
        void readMyChatRooms() {
            ExtractableResponse<Response> response = get("/chat/rooms/me", requesterId);

            assertOk(response);
            assertThat(response.jsonPath().getLong("data.rooms[0].roomId")).isEqualTo(roomId);
            assertThat(response.jsonPath().getLong("data.rooms[0].trade.tradeId")).isEqualTo(tradeId);
            assertThat(response.jsonPath().getLong("data.rooms[0].otherMember.memberId")).isEqualTo(ownerId);
        }

        @Test
        @DisplayName("GET /chat/rooms/{roomId} - 지연 로딩되는 상대 회원과 게시글까지 응답에 담긴다")
        void readChatRoom() {
            ExtractableResponse<Response> response = get("/chat/rooms/" + roomId, requesterId);

            assertOk(response);
            assertThat(response.jsonPath().getString("data.trade.title")).isEqualTo(tradeTitle);
            assertThat(response.jsonPath().getString("data.otherMember.nickname")).isEqualTo("owner");
        }
    }

    @Nested
    @DisplayName("ChatMessageController")
    class ChatMessageApi {

        @Test
        @DisplayName("GET /chat/rooms/{roomId}/messages - 메시지 목록을 반환한다")
        void readChatMessages() {
            ExtractableResponse<Response> response = get("/chat/rooms/" + roomId + "/messages", requesterId);

            assertOk(response);
            assertThat(response.jsonPath().getBoolean("data.hasNext")).isFalse();
        }
    }

    @Nested
    @DisplayName("MemberController")
    class MemberApi {

        @Test
        @DisplayName("GET /members/me - 내 정보를 반환한다")
        void readMe() {
            ExtractableResponse<Response> response = get("/members/me", requesterId);

            assertOk(response);
            assertThat(response.jsonPath().getString("data.nickname")).isEqualTo("requester");
        }

        @Test
        @DisplayName("GET /blocks - 차단한 회원의 닉네임까지 응답에 담긴다")
        void readMyBlocks() {
            memberBlockJpaRepository.save(MemberBlock.of(requesterId, ownerId));

            ExtractableResponse<Response> response = get("/blocks", requesterId);

            assertOk(response);
            assertThat(response.jsonPath().getLong("data.blocks[0].memberId")).isEqualTo(ownerId);
            assertThat(response.jsonPath().getString("data.blocks[0].nickname")).isEqualTo("owner");
        }
    }

    @Nested
    @DisplayName("StoreController")
    class StoreApi {

        @Test
        @DisplayName("GET /stores/nearby - 주변 매장 목록을 반환한다")
        void readNearbyStores() {
            ExtractableResponse<Response> response =
                    get("/stores/nearby?latitude=37.5563&longitude=126.9236&radius=3000", null);

            assertOk(response);
        }
    }

    private ExtractableResponse<Response> get(final String path, final Long memberId) {
        var request = RestAssured.given().log().ifValidationFails();
        if (memberId != null) {
            request = request.header("Authorization", "Bearer " + jwtProvider.createToken(memberId));
        }
        return request.when().get(API + path).then().log().ifValidationFails().extract();
    }

    private void assertOk(final ExtractableResponse<Response> response) {
        assertThat(response.statusCode())
                .as("응답 본문: %s", response.asString())
                .isEqualTo(HttpStatus.OK.value());
    }

    private Member createMember(final String nickname) {
        return Member.builder()
                .oauthId(new OauthId(nickname + UUID.randomUUID(), OauthProviderType.KAKAO))
                .oauthUsername(nickname + "-oauth")
                .nickname(nickname)
                .build();
    }
}

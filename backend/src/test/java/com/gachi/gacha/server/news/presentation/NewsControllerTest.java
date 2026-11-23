package com.gachi.gacha.server.news.presentation;

import static com.gachi.gacha.server.news.domain.NewsFixtures.news;
import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.news.domain.CollectPeriod;
import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsBatchJpaRepository;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsCandidateJpaRepository;
import com.gachi.gacha.server.news.domain.NewsItem;
import com.gachi.gacha.server.news.domain.NewsItemJpaRepository;
import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsMemberTopic;
import com.gachi.gacha.server.news.domain.NewsMemberTopicJpaRepository;
import com.gachi.gacha.server.news.domain.NewsSection;
import io.restassured.RestAssured;
import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 요청은 테스트와 다른 스레드에서 처리되므로 테스트 자체에는 트랜잭션을 걸지 않고, 데이터는 직접 만들고 지운다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class NewsControllerTest {

    private static final String API = "/api/v1/news/CHIIKAWA";
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

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
    private NewsBatchJpaRepository batchRepository;

    @Autowired
    private NewsCandidateJpaRepository candidateRepository;

    @Autowired
    private NewsItemJpaRepository itemRepository;

    @Autowired
    private NewsMemberTopicJpaRepository memberTopicRepository;

    private Long memberId;
    private Long batchId;
    private int sequence;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        memberId = memberJpaRepository.save(Member.builder()
                .oauthId(new OauthId("news" + UUID.randomUUID(), OauthProviderType.KAKAO))
                .oauthUsername("news-oauth")
                .nickname("news-member")
                .build()).getId();
        LocalDate today = LocalDate.now(KST);
        batchId = batchRepository.save(NewsBatch.start("CHIIKAWA", "THURSDAY",
                List.of(CollectPeriod.notCollected("chiikawashop_kr", today.minusDays(7), today)), false, "chiikawa-v2")).getId();
        LocalDateTime past = LocalDateTime.now().minusHours(1);
        saveItem("끝난 소식", today.minusDays(5), today.minusDays(2), past);
        saveItem("곧 시작하는 소식", today.plusDays(3), null, past);
        saveItem("아직 공개 전", today.plusDays(3), null, LocalDateTime.now().plusDays(1));
    }

    @AfterEach
    void tearDown() {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            entityManager.createQuery("DELETE FROM NewsItem item WHERE item.candidate.batchId = :batchId")
                    .setParameter("batchId", batchId).executeUpdate();
            entityManager.createQuery("DELETE FROM NewsCandidate candidate WHERE candidate.batchId = :batchId")
                    .setParameter("batchId", batchId).executeUpdate();
            entityManager.createQuery("DELETE FROM NewsBatch batch WHERE batch.id = :batchId")
                    .setParameter("batchId", batchId).executeUpdate();
            entityManager.createQuery("DELETE FROM NewsMemberTopic topic WHERE topic.memberId = :memberId")
                    .setParameter("memberId", memberId).executeUpdate();
            memberJpaRepository.deleteAllByIdInBatch(List.of(memberId));
        });
    }

    @Test
    @DisplayName("GET /news/{topic} - 공개된 소식을 끝나지 않은 소식이 위, 끝난 소식이 아래로 200 OK 와 C000 으로 반환한다.")
    void getItems() {
        // when
        ExtractableResponse<Response> response = request().get(API).then().log().ifValidationFails().extract();

        // then
        assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(response.jsonPath().getString("code")).isEqualTo("C000");
        assertThat(response.jsonPath().getList("data.items.title")).containsExactly("곧 시작하는 소식", "끝난 소식");
        assertThat(response.jsonPath().getString("data.items[0].timing")).isEqualTo("UPCOMING");
        assertThat(response.jsonPath().getString("data.items[0].kind")).isEqualTo("RELEASE");
        assertThat(response.jsonPath().getString("data.items[0].kindLabel")).isEqualTo("발매");
        assertThat(response.jsonPath().getString("data.items[0].sectionLabel")).isEqualTo("한국 매장");
        assertThat(response.jsonPath().getString("data.items[0].location")).isEqualTo("치이카와샵 용산점");
        assertThat(response.jsonPath().getString("data.items[1].timing")).isEqualTo("ENDED");
        assertThat(response.jsonPath().getBoolean("data.hasNext")).isFalse();
    }

    @Test
    @DisplayName("GET /news/{topic} - 페이지 크기가 범위를 벗어나면 400 과 CE004 를, 없는 주제면 404 와 NWE002 를 반환한다.")
    void getItems_invalidRequests() {
        ExtractableResponse<Response> invalidSize = request().get(API + "?size=0").then().extract();
        ExtractableResponse<Response> unknownTopic = request().get("/api/v1/news/UNKNOWN").then().extract();

        assertThat(invalidSize.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(invalidSize.jsonPath().getString("code")).isEqualTo("CE004");
        assertThat(unknownTopic.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(unknownTopic.jsonPath().getString("code")).isEqualTo("NWE002");
    }

    @Test
    @DisplayName("GET /news/{topic} - 로그인하지 않으면 401 과 CE005 를 반환한다.")
    void getItems_unauthorized() {
        ExtractableResponse<Response> response = RestAssured.given().when().get(API).then().extract();

        assertThat(response.statusCode()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        assertThat(response.jsonPath().getString("code")).isEqualTo("CE005");
    }

    @Test
    @DisplayName("새 소식 여부는 탭을 본 적이 없으면 true 이고, 탭을 봤다고 기록하면 false 가 된다.")
    void newItemsAndViewed() {
        // when
        boolean before = request().get(API + "/new").then().extract().jsonPath().getBoolean("data.hasNew");
        ExtractableResponse<Response> viewed = request().put(API + "/viewed").then().log().ifValidationFails().extract();
        boolean after = request().get(API + "/new").then().extract().jsonPath().getBoolean("data.hasNew");

        // then
        assertThat(before).isTrue();
        assertThat(viewed.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(after).isFalse();
    }

    @Test
    @DisplayName("구독은 기본값이 꺼짐이고, 켜고 끌 수 있으며, 꺼도 끈 기록이 남는다.")
    void subscription() {
        // when
        boolean initial = request().get(API + "/subscription").then().extract().jsonPath().getBoolean("data.subscribed");
        ExtractableResponse<Response> on = put(true);
        boolean afterOn = request().get(API + "/subscription").then().extract().jsonPath().getBoolean("data.subscribed");
        ExtractableResponse<Response> off = put(false);
        boolean afterOff = request().get(API + "/subscription").then().extract().jsonPath().getBoolean("data.subscribed");

        // then
        assertThat(initial).isFalse();
        assertThat(on.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(on.jsonPath().getBoolean("data.subscribed")).isTrue();
        assertThat(afterOn).isTrue();
        assertThat(off.jsonPath().getBoolean("data.subscribed")).isFalse();
        assertThat(afterOff).isFalse();
        NewsMemberTopic saved = memberTopicRepository.findByMemberIdAndTopic(memberId, "CHIIKAWA").orElseThrow();
        assertThat(saved.getSubscribedAt()).isNotNull();
        assertThat(saved.getUnsubscribedAt()).isNotNull();
    }

    @Test
    @DisplayName("PUT /news/{topic}/subscription - subscribed 가 없으면 400 을 반환한다.")
    void subscription_missingField() {
        ExtractableResponse<Response> response = request().contentType(MediaType.APPLICATION_JSON_VALUE).body("{}")
                .put(API + "/subscription").then().extract();

        assertThat(response.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
    }

    private ExtractableResponse<Response> put(final boolean subscribed) {
        return request().contentType(MediaType.APPLICATION_JSON_VALUE).body("{\"subscribed\": " + subscribed + "}")
                .put(API + "/subscription").then().log().ifValidationFails().extract();
    }

    private RequestSpecification request() {
        return RestAssured.given().log().ifValidationFails()
                .header("Authorization", "Bearer " + jwtProvider.createToken(memberId));
    }

    private void saveItem(final String title, final LocalDate start, final LocalDate end, final LocalDateTime publishedAt) {
        sequence++;
        NewsCandidate candidate = candidateRepository.save(NewsCandidate.collected(batchId, news(NewsSection.KOREA_STORE,
                NewsKind.RELEASE, title, start, end, "https://x.com/a/status/" + (5000 + sequence), true, null)));
        itemRepository.save(NewsItem.publish("CHIIKAWA", candidate, publishedAt));
    }
}

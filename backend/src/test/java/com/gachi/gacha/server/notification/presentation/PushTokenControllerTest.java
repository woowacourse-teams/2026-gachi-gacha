package com.gachi.gacha.server.notification.presentation;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.notification.domain.PushPlatform;
import com.gachi.gacha.server.notification.domain.PushToken;
import com.gachi.gacha.server.notification.domain.PushTokenJpaRepository;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import jakarta.persistence.EntityManager;
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
import org.springframework.http.HttpStatus;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 요청은 테스트와 다른 스레드에서 처리되므로 테스트 자체에는 트랜잭션을 걸지 않고, 데이터는 직접 만들고 지운다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PushTokenControllerTest {

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
    private PushTokenJpaRepository pushTokenJpaRepository;

    private final String token = "fcm-token-" + UUID.randomUUID();

    private Long memberId;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        memberId = memberJpaRepository.save(createMember()).getId();
    }

    @AfterEach
    void tearDown() {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            entityManager.createQuery("DELETE FROM PushToken pushToken WHERE pushToken.memberId = :memberId")
                    .setParameter("memberId", memberId)
                    .executeUpdate();
            memberJpaRepository.deleteAllByIdInBatch(List.of(memberId));
        });
    }

    @Nested
    @DisplayName("PUT /push-tokens - 푸시 토큰 등록 API")
    class RegisterPushToken {

        @Test
        @DisplayName("토큰을 등록하면 200 OK와 C002를 반환한다.")
        void registerPushToken_success() {
            // when
            ExtractableResponse<Response> response = request(memberId)
                    .body("{\"token\":\"" + token + "\",\"platform\":\"IOS\"}")
                    .put(API + "/push-tokens")
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C002");
            assertThat(pushTokenJpaRepository.findByToken(token)).isPresent();
        }

        @Test
        @DisplayName("토큰이 비어 있으면 400과 CE001을 반환한다.")
        void registerPushToken_blankToken() {
            // when
            ExtractableResponse<Response> response = request(memberId)
                    .body("{\"token\":\" \",\"platform\":\"IOS\"}")
                    .put(API + "/push-tokens")
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("CE001");
        }

        @Test
        @DisplayName("플랫폼 값이 잘못되면 400과 CE001을 반환한다.")
        void registerPushToken_invalidPlatform() {
            // when
            ExtractableResponse<Response> response = request(memberId)
                    .body("{\"token\":\"" + token + "\",\"platform\":\"WINDOWS\"}")
                    .put(API + "/push-tokens")
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("CE001");
        }

        @Test
        @DisplayName("인증 토큰 없이 요청하면 401과 CE005를 반환한다.")
        void registerPushToken_withoutToken() {
            // when
            ExtractableResponse<Response> response = RestAssured.given().log().ifValidationFails()
                    .contentType(ContentType.JSON)
                    .body("{\"token\":\"" + token + "\",\"platform\":\"IOS\"}")
                    .when()
                    .put(API + "/push-tokens")
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("CE005");
        }
    }

    @Nested
    @DisplayName("DELETE /push-tokens - 푸시 토큰 삭제 API")
    class UnregisterPushToken {

        @Test
        @DisplayName("내 토큰을 삭제하면 200 OK와 C003을 반환한다.")
        void unregisterPushToken_success() {
            // given
            pushTokenJpaRepository.save(PushToken.of(memberId, token, PushPlatform.ANDROID));

            // when
            ExtractableResponse<Response> response = request(memberId)
                    .body("{\"token\":\"" + token + "\"}")
                    .delete(API + "/push-tokens")
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C003");
            assertThat(pushTokenJpaRepository.findByToken(token)).isEmpty();
        }
    }

    private RequestSpecification request(final Long requesterId) {
        return RestAssured.given().log().ifValidationFails()
                .header("Authorization", "Bearer " + jwtProvider.createToken(requesterId))
                .contentType(ContentType.JSON)
                .when();
    }

    private Member createMember() {
        return Member.builder()
                .oauthId(new OauthId("push-" + UUID.randomUUID(), OauthProviderType.KAKAO))
                .oauthUsername("push-oauth")
                .nickname("push-member")
                .build();
    }
}

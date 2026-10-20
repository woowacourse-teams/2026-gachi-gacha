package com.gachi.gacha.server.member.presentation;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberBlock;
import com.gachi.gacha.server.member.domain.MemberBlockJpaRepository;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import io.restassured.RestAssured;
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
class MemberBlockControllerTest {

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
    private MemberBlockJpaRepository memberBlockJpaRepository;

    private Long blockerId;
    private Long blockedId;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        blockerId = memberJpaRepository.save(createMember("blocker")).getId();
        blockedId = memberJpaRepository.save(createMember("blocked")).getId();
    }

    @AfterEach
    void tearDown() {
        List<Long> memberIds = List.of(blockerId, blockedId);
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            entityManager.createQuery("""
                            DELETE FROM MemberBlock memberBlock
                            WHERE memberBlock.blockerId IN :memberIds OR memberBlock.blockedId IN :memberIds
                            """)
                    .setParameter("memberIds", memberIds)
                    .executeUpdate();
            memberJpaRepository.deleteAllByIdInBatch(memberIds);
        });
    }

    @Nested
    @DisplayName("PUT /blocks/{blockedMemberId} - 회원 차단 API")
    class BlockMember {

        @Test
        @DisplayName("다른 회원을 차단하면 200 OK와 C002, 차단 결과를 반환한다.")
        void blockMember_success() {
            // when
            ExtractableResponse<Response> response = request(blockerId)
                    .put(API + "/blocks/" + blockedId)
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C002");
            assertThat(response.jsonPath().getLong("data.memberId")).isEqualTo(blockedId);
            assertThat(response.jsonPath().getBoolean("data.blocked")).isTrue();
            assertThat(response.jsonPath().getString("data.blockedAt")).isNotBlank();
        }

        @Test
        @DisplayName("자기 자신을 차단하면 400과 BLE001을 반환한다.")
        void blockMember_self() {
            // when
            ExtractableResponse<Response> response = request(blockerId)
                    .put(API + "/blocks/" + blockerId)
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("BLE001");
        }

        @Test
        @DisplayName("존재하지 않는 회원을 차단하면 404와 AUE02를 반환한다.")
        void blockMember_memberNotFound() {
            // when
            ExtractableResponse<Response> response = request(blockerId)
                    .put(API + "/blocks/9999999")
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("AUE02");
        }

        @Test
        @DisplayName("인증 토큰 없이 요청하면 401과 CE005를 반환한다.")
        void blockMember_withoutToken() {
            // when
            ExtractableResponse<Response> response = RestAssured.given().log().ifValidationFails()
                    .when()
                    .put(API + "/blocks/" + blockedId)
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("CE005");
        }
    }

    @Nested
    @DisplayName("DELETE /blocks/{blockedMemberId} - 회원 차단 해제 API")
    class UnblockMember {

        @Test
        @DisplayName("차단한 회원을 해제하면 200 OK와 C003을 반환하고 data는 생략한다.")
        void unblockMember_success() {
            // given
            memberBlockJpaRepository.save(MemberBlock.of(blockerId, blockedId));

            // when
            ExtractableResponse<Response> response = request(blockerId)
                    .delete(API + "/blocks/" + blockedId)
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C003");
            assertThat(response.jsonPath().getString("data")).isNull();
            assertThat(memberBlockJpaRepository.existsBetween(blockerId, blockedId)).isFalse();
        }
    }

    @Nested
    @DisplayName("GET /blocks - 내 차단 목록 조회 API")
    class ReadBlockedMembers {

        @Test
        @DisplayName("내가 차단한 회원 목록을 200 OK와 C000으로 반환한다.")
        void readBlockedMembers_success() {
            // given
            memberBlockJpaRepository.save(MemberBlock.of(blockerId, blockedId));

            // when
            ExtractableResponse<Response> response = request(blockerId)
                    .get(API + "/blocks")
                    .then().log().ifValidationFails()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C000");
            assertThat(response.jsonPath().getList("data.blocks")).hasSize(1);
            assertThat(response.jsonPath().getLong("data.blocks[0].memberId")).isEqualTo(blockedId);
            assertThat(response.jsonPath().getString("data.blocks[0].nickname")).isEqualTo("blocked");
            assertThat(response.jsonPath().getString("data.blocks[0].blockedAt")).isNotBlank();
        }
    }

    private RequestSpecification request(final Long memberId) {
        return RestAssured.given().log().ifValidationFails()
                .header("Authorization", "Bearer " + jwtProvider.createToken(memberId))
                .when();
    }

    private Member createMember(final String nickname) {
        return Member.builder()
                .oauthId(new OauthId(nickname + UUID.randomUUID(), OauthProviderType.KAKAO))
                .oauthUsername(nickname + "-oauth")
                .nickname(nickname)
                .build();
    }
}

package com.gachi.gacha.server.notification.presentation;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.notification.domain.Notification;
import com.gachi.gacha.server.notification.domain.NotificationJpaRepository;
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
class NotificationControllerTest {

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
    private NotificationJpaRepository notificationJpaRepository;

    private Long receiverId;
    private Long otherId;
    private Long notificationId;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        receiverId = memberJpaRepository.save(createMember("receiver")).getId();
        otherId = memberJpaRepository.save(createMember("other")).getId();
        notificationId = notificationJpaRepository.save(
                Notification.ofComment(receiverId, 10L, 20L, "가챠친구", "교환 가능할까요?")
        ).getId();
    }

    @AfterEach
    void tearDown() {
        List<Long> memberIds = List.of(receiverId, otherId);
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            entityManager.createQuery("DELETE FROM Notification n WHERE n.receiverId IN :memberIds")
                    .setParameter("memberIds", memberIds)
                    .executeUpdate();
            memberJpaRepository.deleteAllByIdInBatch(memberIds);
        });
    }

    @Test
    @DisplayName("GET /notifications - 알림 목록을 200 OK와 C000으로 반환한다.")
    void getNotifications() {
        // when
        ExtractableResponse<Response> response = request(receiverId)
                .get(API + "/notifications")
                .then().log().ifValidationFails()
                .extract();

        // then
        assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(response.jsonPath().getString("code")).isEqualTo("C000");
        assertThat(response.jsonPath().getLong("data.notifications[0].notificationId")).isEqualTo(notificationId);
        assertThat(response.jsonPath().getString("data.notifications[0].type")).isEqualTo("COMMENT");
        assertThat(response.jsonPath().getString("data.notifications[0].body")).isEqualTo("가챠친구: 교환 가능할까요?");
        assertThat(response.jsonPath().getBoolean("data.notifications[0].read")).isFalse();
        assertThat(response.jsonPath().getBoolean("data.hasNext")).isFalse();
    }

    @Test
    @DisplayName("GET /notifications - 페이지 크기가 범위를 벗어나면 400과 CE004를 반환한다.")
    void getNotifications_invalidPageSize() {
        // when
        ExtractableResponse<Response> response = request(receiverId)
                .get(API + "/notifications?pageSize=0")
                .then().log().ifValidationFails()
                .extract();

        // then
        assertThat(response.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(response.jsonPath().getString("code")).isEqualTo("CE004");
    }

    @Test
    @DisplayName("GET /notifications/unread-count - 안 읽은 알림 수를 반환한다.")
    void getUnreadCount() {
        // when
        ExtractableResponse<Response> response = request(receiverId)
                .get(API + "/notifications/unread-count")
                .then().log().ifValidationFails()
                .extract();

        // then
        assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(response.jsonPath().getLong("data.unreadCount")).isEqualTo(1L);
    }

    @Test
    @DisplayName("PATCH /notifications/{notificationId}/read - 내 알림을 읽음 처리하면 200 OK와 C002를 반환한다.")
    void readNotification() {
        // when
        ExtractableResponse<Response> response = request(receiverId)
                .patch(API + "/notifications/" + notificationId + "/read")
                .then().log().ifValidationFails()
                .extract();

        // then
        assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(response.jsonPath().getString("code")).isEqualTo("C002");
        assertThat(notificationJpaRepository.countByReceiverIdAndIsReadFalse(receiverId)).isZero();
    }

    @Test
    @DisplayName("PATCH /notifications/{notificationId}/read - 다른 회원의 알림이면 404와 NTE001을 반환한다.")
    void readNotification_othersNotification() {
        // when
        ExtractableResponse<Response> response = request(otherId)
                .patch(API + "/notifications/" + notificationId + "/read")
                .then().log().ifValidationFails()
                .extract();

        // then
        assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(response.jsonPath().getString("code")).isEqualTo("NTE001");
    }

    @Test
    @DisplayName("PATCH /notifications/read-all - 모두 읽음 처리하면 200 OK와 C002를 반환한다.")
    void readAllNotifications() {
        // when
        ExtractableResponse<Response> response = request(receiverId)
                .patch(API + "/notifications/read-all")
                .then().log().ifValidationFails()
                .extract();

        // then
        assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(response.jsonPath().getString("code")).isEqualTo("C002");
        assertThat(notificationJpaRepository.countByReceiverIdAndIsReadFalse(receiverId)).isZero();
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

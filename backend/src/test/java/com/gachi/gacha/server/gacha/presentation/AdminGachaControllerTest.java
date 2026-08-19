package com.gachi.gacha.server.gacha.presentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gachi.gacha.server.common.infra.config.ImageUploader;
import com.gachi.gacha.server.infrastructure.instagram.dto.InstagramResponse;
import com.gachi.gacha.server.infrastructure.instagram.dto.InstagramResponse.BusinessDiscovery;
import com.gachi.gacha.server.infrastructure.instagram.dto.InstagramResponse.Media;
import com.gachi.gacha.server.infrastructure.instagram.dto.InstagramResponse.MediaData;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.client.RestTemplate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AdminGachaControllerTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @LocalServerPort
    private int port;

    @MockitoBean
    private RestTemplate restTemplate;

    @MockitoBean
    private ImageUploader imageUploader;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        when(imageUploader.uploadFromUrl(any(), any()))
                .thenReturn("https://test-bucket.s3.amazonaws.com/gachigacha/gacha/test.jpg");
    }

    @Nested
    @DisplayName("POST /admin/gachas/collect - 인스타그램 데이터 수동 수집 API")
    class Collect {

        @Test
        @DisplayName("키워드가 포함된 신규 게시글을 PENDING 가챠로 수집하고 수집 건수를 반환한다.")
        void collect_savesNewKeywordMatchedPost() {
            // given
            String username = uniqueUsername();
            createStoreWithInstagram(username);
            stubInstagramPosts(username, List.of(
                    mediaData("media-" + username, "신상 입고 안내입니다")
            ));

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .post("/api/v1/admin/gachas/collect")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C000");
            assertThat(response.jsonPath().getInt("data.collectedCount")).isEqualTo(1);
        }

        @Test
        @DisplayName("키워드가 없는 게시글은 수집하지 않는다.")
        void collect_skipsPostWithoutKeyword() {
            // given
            String username = uniqueUsername();
            createStoreWithInstagram(username);
            stubInstagramPosts(username, List.of(
                    mediaData("media-" + username, "그냥 일상 사진입니다")
            ));

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .post("/api/v1/admin/gachas/collect")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getInt("data.collectedCount")).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("GET /admin/gachas/pending - 대기 중인 가챠 목록 조회 API")
    class Pending {

        @Test
        @DisplayName("수집된 PENDING 가챠가 목록에 포함된다.")
        void pending_containsCollectedGacha() {
            // given
            String username = uniqueUsername();
            createStoreWithInstagram(username);
            stubInstagramPosts(username, List.of(
                    mediaData("media-" + username, "재입고 되었습니다")
            ));
            RestAssured.given().post("/api/v1/admin/gachas/collect");

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .get("/api/v1/admin/gachas/pending")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C000");
            assertThat(response.jsonPath().getList("data.caption", String.class))
                    .contains("재입고 되었습니다");
        }
    }

    @Nested
    @DisplayName("PATCH /admin/gachas/{gachaId}/approve - 가챠 승인 API")
    class Approve {

        @Test
        @DisplayName("승인하면 이름과 상태가 변경된 결과를 반환하고, 더 이상 PENDING 목록에 나타나지 않는다.")
        void approve_updatesNameAndStatus() {
            // given
            Long gachaId = collectSingleGacha();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .contentType(ContentType.JSON)
                    .body(Map.of("name", "귀멸의 칼날 상현2 쿠지"))
                    .when()
                    .patch("/api/v1/admin/gachas/{gachaId}/approve", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C002");
            assertThat(response.jsonPath().getLong("data.gachaId")).isEqualTo(gachaId);
            assertThat(response.jsonPath().getString("data.name")).isEqualTo("귀멸의 칼날 상현2 쿠지");
            assertThat(response.jsonPath().getString("data.status")).isEqualTo("APPROVED");

            ExtractableResponse<Response> pendingAfter = RestAssured.given()
                    .when()
                    .get("/api/v1/admin/gachas/pending")
                    .then()
                    .extract();
            assertThat(pendingAfter.jsonPath().getList("data.gachaId", Long.class)).doesNotContain(gachaId);
        }

        @Test
        @DisplayName("존재하지 않는 가챠를 승인하려 하면 404 Not Found를 반환한다.")
        void approve_notFound() {
            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .contentType(ContentType.JSON)
                    .body(Map.of("name", "이름"))
                    .when()
                    .patch("/api/v1/admin/gachas/{gachaId}/approve", 999_999L)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("GE001");
        }
    }

    @Nested
    @DisplayName("PATCH /admin/gachas/{gachaId}/reject - 가챠 거절 API")
    class Reject {

        @Test
        @DisplayName("거절하면 상태가 REJECTED로 변경된 결과를 반환한다.")
        void reject_updatesStatus() {
            // given
            Long gachaId = collectSingleGacha();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .patch("/api/v1/admin/gachas/{gachaId}/reject", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C002");
            assertThat(response.jsonPath().getLong("data.gachaId")).isEqualTo(gachaId);
            assertThat(response.jsonPath().getString("data.status")).isEqualTo("REJECTED");
        }

        @Test
        @DisplayName("존재하지 않는 가챠를 거절하려 하면 404 Not Found를 반환한다.")
        void reject_notFound() {
            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .patch("/api/v1/admin/gachas/{gachaId}/reject", 999_999L)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("GE001");
        }
    }

    private Long collectSingleGacha() {
        String username = uniqueUsername();
        createStoreWithInstagram(username);
        stubInstagramPosts(username, List.of(
                mediaData("media-" + username, "입고 예정입니다")
        ));
        RestAssured.given().post("/api/v1/admin/gachas/collect");

        ExtractableResponse<Response> pending = RestAssured.given()
                .when()
                .get("/api/v1/admin/gachas/pending")
                .then()
                .extract();

        int index = pending.jsonPath().getList("data.caption", String.class).indexOf("입고 예정입니다");
        assertThat(index).isNotNegative();
        return pending.jsonPath().getLong("data[" + index + "].gachaId");
    }

    private String uniqueUsername() {
        return "shop_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private MediaData mediaData(final String mediaId, final String caption) {
        return new MediaData(mediaId, caption, "https://cdn/media.jpg", "https://cdn/thumb.jpg", "IMAGE", null);
    }

    private void stubInstagramPosts(final String username, final List<MediaData> mediaDataList) {
        InstagramResponse response = new InstagramResponse(new BusinessDiscovery(new Media(mediaDataList, null)));
        when(restTemplate.getForObject(
                argThat((URI uri) -> uri != null && uri.toString().contains(username)),
                eq(InstagramResponse.class)
        )).thenReturn(response);
    }

    private void createStoreWithInstagram(final String instagramId) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("name", "테스트 상점 " + instagramId);
        request.put("latitude", 37.5);
        request.put("longitude", 127.0);
        request.put("instagramId", instagramId);
        request.put("address", "서울시 테스트로 1");

        try {
            RestAssured.given().log().all()
                    .multiPart("request", "request.json", OBJECT_MAPPER.writeValueAsBytes(request), "application/json")
                    .when()
                    .post("/api/v1/stores")
                    .then().log().all()
                    .statusCode(HttpStatus.CREATED.value());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}

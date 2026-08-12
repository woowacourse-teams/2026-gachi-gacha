package com.gachi.gacha.server.store.presentation;

import static org.assertj.core.api.Assertions.assertThat;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;


@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class StoreControllerTest {

    private static final String STORE_NAME = "테스트 매장";
    private static final String STORE_ADDRESS = "서울시 마포구 테스트로 1";
    private static final double STORE_LATITUDE = 37.5299;
    private static final double STORE_LONGITUDE = 126.9648;

    @LocalServerPort
    private int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
    }

    @Nested
    @DisplayName("POST /stores - 매장 생성 API")
    class CreateStore {

        @Test
        @DisplayName("올바른 요청이 들어오면 201 Created 응답과 Location 헤더를 반환한다.")
        void createStore_success() {
            // given
            Map<String, Object> request = createStoreRequest(STORE_NAME, STORE_LATITUDE, STORE_LONGITUDE);

            // when
            ExtractableResponse<Response> response = requestCreateStore(request);

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.CREATED.value());
            assertThat(response.header("Location")).isNotNull();
            assertThat(response.jsonPath().getString("code")).isEqualTo("C001");
            assertThat(response.jsonPath().getLong("data.storeId")).isPositive();
            assertThat(response.jsonPath().getString("data.createdAt")).isNotBlank();
        }

        @Test
        @DisplayName("필수 값이 공백이면 400 Bad Request를 반환한다.")
        void createStore_invalidRequest() {
            // given
            Map<String, Object> request = createStoreRequest("", STORE_LATITUDE, STORE_LONGITUDE);
            request.put("address", "");

            // when
            ExtractableResponse<Response> response = requestCreateStore(request);

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("CE001");
        }
    }

    @Nested
    @DisplayName("GET /stores - 매장 목록 조회 API")
    class ReadStoreList {

        @Test
        @DisplayName("매장 목록 조회를 요청하면 200 OK와 페이징된 목록을 반환한다.")
        void readStores_success() {
            // given
            Long storeId = createTargetStore();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .param("page", 0)
                    .param("size", 20)
                    .when()
                    .get("/api/v1/stores")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C000");
            assertThat(response.jsonPath().getList("data.content")).isNotEmpty();
            assertThat(response.jsonPath().getList("data.content.storeId", Long.class)).contains(storeId);
            assertThat(response.jsonPath().getInt("data.number")).isZero();
            assertThat(response.jsonPath().getInt("data.size")).isEqualTo(20);
            assertThat(response.jsonPath().getInt("data.pageable.pageNumber")).isZero();
            assertThat(response.jsonPath().getInt("data.content[0].gachaMachineAmount")).isEqualTo(10);
        }
    }

    @Nested
    @DisplayName("GET /stores/{storeId} - 매장 상세 조회 API")
    class ReadStoreDetail {

        @Test
        @DisplayName("매장 상세 조회에 성공하면 200 OK와 상세 정보를 반환한다.")
        void readStore_success() {
            // given
            Long storeId = createTargetStore();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .get("/api/v1/stores/{storeId}", storeId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C000");
            assertThat(response.jsonPath().getLong("data.storeId")).isEqualTo(storeId);
            assertThat(response.jsonPath().getString("data.name")).isEqualTo(STORE_NAME);
            assertThat(response.jsonPath().getString("data.address")).isEqualTo(STORE_ADDRESS);
            assertThat(response.jsonPath().getString("data.paymentMethods")).isEqualTo("현금, 카드");
            assertThat(response.jsonPath().getInt("data.gachaMachineAmount")).isEqualTo(10);
            assertThat(response.jsonPath().getInt("data.kujiAmount")).isEqualTo(5);
        }

        @Test
        @DisplayName("존재하지 않는 매장 ID 조회 시 404 Not Found를 반환한다.")
        void readStore_notFound() {
            // given
            Long nonExistentStoreId = 999_999L;

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .get("/api/v1/stores/{storeId}", nonExistentStoreId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("SE001");
        }
    }

    @Nested
    @DisplayName("GET /stores/nearby - 주변 매장 조회 API")
    class ReadNearbyStores {

        @Test
        @DisplayName("반경 안의 매장을 거리 오름차순으로 반환한다.")
        void readNearbyStores_success() {
            // given
            double latitude = 37.5665;
            double longitude = 126.9780;
            Long storeId = createTargetStore("주변 매장", latitude, longitude);

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .param("latitude", latitude)
                    .param("longitude", longitude)
                    .param("radius", 3_000)
                    .when()
                    .get("/api/v1/stores/nearby")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C000");
            assertThat(response.jsonPath().getList("data.stores.storeId", Long.class)).contains(storeId);
            assertThat(response.jsonPath().getDouble("data.stores[0].distance")).isZero();
        }

        @Test
        @DisplayName("검색 반경이 허용 범위를 벗어나면 400 Bad Request를 반환한다.")
        void readNearbyStores_invalidRadius() {
            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .param("latitude", STORE_LATITUDE)
                    .param("longitude", STORE_LONGITUDE)
                    .param("radius", 99)
                    .when()
                    .get("/api/v1/stores/nearby")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("CE001");
        }
    }

    @Nested
    @DisplayName("PATCH /stores/{storeId} - 매장 수정 API")
    class UpdateStore {

        @Test
        @DisplayName("매장 정보 수정 요청에 성공하면 200 OK를 반환한다.")
        void updateStore_success() {
            // given
            Long storeId = createTargetStore();
            Map<String, Object> request = Map.of(
                    "name", "수정된 매장",
                    "businessHours", "매일 10:00-22:00"
            );

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .contentType(ContentType.JSON)
                    .body(request)
                    .when()
                    .patch("/api/v1/stores/{storeId}", storeId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C002");
            assertThat(response.jsonPath().getLong("data.storeId")).isEqualTo(storeId);
            assertThat(response.jsonPath().getString("data.updatedAt")).isNotBlank();
        }

        @Test
        @DisplayName("존재하지 않는 매장 ID 수정 시 404 Not Found를 반환한다.")
        void updateStore_notFound() {
            // given
            Long nonExistentStoreId = 999_999L;
            Map<String, Object> request = Map.of("name", "수정된 매장");

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .contentType(ContentType.JSON)
                    .body(request)
                    .when()
                    .patch("/api/v1/stores/{storeId}", nonExistentStoreId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("SE001");
        }
    }

    @Nested
    @DisplayName("DELETE /stores/{storeId} - 매장 삭제 API")
    class DeleteStore {

        @Test
        @DisplayName("매장 삭제 요청에 성공하면 200 OK를 반환한다.")
        void deleteStore_success() {
            // given
            Long storeId = createTargetStore();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .delete("/api/v1/stores/{storeId}", storeId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C003");
            assertThat(response.jsonPath().getLong("data.storeId")).isEqualTo(storeId);
        }

        @Test
        @DisplayName("존재하지 않는 매장 ID 삭제 시 404 Not Found를 반환한다.")
        void deleteStore_notFound() {
            // given
            Long nonExistentStoreId = 999_999L;

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .delete("/api/v1/stores/{storeId}", nonExistentStoreId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("SE001");
        }
    }

    private Long createTargetStore() {
        return createTargetStore(STORE_NAME, STORE_LATITUDE, STORE_LONGITUDE);
    }

    private Long createTargetStore(final String name, final double latitude, final double longitude) {
        Map<String, Object> request = createStoreRequest(name, latitude, longitude);
        return requestCreateStore(request).jsonPath().getLong("data.storeId");
    }

    private Map<String, Object> createStoreRequest(
            final String name,
            final double latitude,
            final double longitude
    ) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("name", name);
        request.put("thumbnailUrl", "https://example.com/store.png");
        request.put("latitude", latitude);
        request.put("longitude", longitude);
        request.put("phoneNumber", "02-1234-5678");
        request.put("instagramId", "test_store");
        request.put("address", STORE_ADDRESS);
        request.put("businessHours", "매일 10:00-22:00");
        request.put("paymentMethods", "현금, 카드");
        request.put("gachaMachineAmount", 10);
        request.put("coinPrice", 500);
        request.put("gachaPriceMin", 3_000);
        request.put("gachaPriceMax", 5_000);
        request.put("kujiAmount", 5);
        request.put("kujiPriceMin", 5_000);
        request.put("kujiPriceMax", 10_000);
        request.put("hasSelectGacha", true);
        request.put("selectGachaPriceMin", 3_000);
        request.put("selectGachaPriceMax", 10_000);
        request.put("facilities", List.of("동전교환기"));
        request.put("hasRandomBox", false);
        request.put("imageUrls", List.of("https://example.com/store-image.png"));
        return request;
    }

    private ExtractableResponse<Response> requestCreateStore(final Map<String, Object> request) {
        return RestAssured.given().log().all()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v1/stores")
                .then().log().all()
                .extract();
    }
}

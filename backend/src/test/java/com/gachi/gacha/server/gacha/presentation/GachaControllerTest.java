package com.gachi.gacha.server.gacha.presentation;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GachaControllerTest {

    @LocalServerPort
    private int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
    }

    @Nested
    @DisplayName("POST /gachas - 가챠 생성 API")
    class CreateGacha {

        @Test
        @DisplayName("올바른 요청 파라미터가 들어오면 201 Created 응답과 Location 헤더를 반환한다.")
        void createGacha_success() {
            // given
            Map<String, Object> request = Map.of(
                    "name", "신규 가챠",
                    "caption", "가챠 설명입니다.",
                    "thumbnailUrl", "https://example.com/image.png"
            );

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .contentType(ContentType.JSON)
                    .body(request)
                    .when()
                    .post("/api/v1/gachas")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.CREATED.value());
            assertThat(response.header("Location")).isNotNull();
            assertThat(response.jsonPath().getString("code")).isEqualTo("C001");
            assertThat(response.jsonPath().getLong("data.gachaId")).isNotNull();
        }

        @Test
        @DisplayName("유효하지 않은 요청(빈 값)이 들어오면 400 Bad Request를 반환한다.")
        void createGacha_invalidRequest() {
            // given - 필수 값이 공백인 유효하지 않은 요청
            Map<String, Object> request = Map.of(
                    "name", "",
                    "caption", "",
                    "thumbnailUrl", ""
            );

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .contentType(ContentType.JSON)
                    .body(request)
                    .when()
                    .post("/api/v1/gachas")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        }
    }

    @Nested
    @DisplayName("PUT /gachas/{gachaId} - 가챠 수정 API")
    class UpdateGacha {

        @Test
        @DisplayName("가챠 정보 수정 요청에 성공하면 200 OK를 반환한다.")
        void updateGacha_success() {
            // given
            Long gachaId = createTargetGacha();
            Map<String, Object> updateRequest = Map.of(
                    "name", "수정된 가챠 이름",
                    "caption", "수정된 설명",
                    "thumbnailUrl", "https://example.com/updated.png"
            );

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .contentType(ContentType.JSON)
                    .body(updateRequest)
                    .when()
                    .put("/api/v1/gachas/{gachaId}", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C002");
            assertThat(response.jsonPath().getLong("data.gachaId")).isEqualTo(gachaId);
        }

        @Test
        @DisplayName("존재하지 않는 가챠 ID로 수정 시 404 Not Found를 반환한다.")
        void updateGacha_notFound() {
            // given
            Long nonExistentGachaId = 999999L;
            Map<String, Object> updateRequest = Map.of(
                    "name", "수정된 가챠 이름",
                    "caption", "수정된 설명",
                    "thumbnailUrl", "https://example.com/updated.png"
            );

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .contentType(ContentType.JSON)
                    .body(updateRequest)
                    .when()
                    .put("/api/v1/gachas/{gachaId}", nonExistentGachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }
    }

    @Nested
    @DisplayName("DELETE /gachas/{gachaId} - 가챠 삭제 API")
    class DeleteGacha {

        @Test
        @DisplayName("가챠 삭제 요청에 성공하면 200 OK를 반환한다.")
        void deleteGacha_success() {
            // given
            Long gachaId = createTargetGacha();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .delete("/api/v1/gachas/{gachaId}", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
        }

        @Test
        @DisplayName("존재하지 않는 가챠 ID 삭제 시 404 Not Found를 반환한다.")
        void deleteGacha_notFound() {
            // given
            Long nonExistentGachaId = 999999L;

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .delete("/api/v1/gachas/{gachaId}", nonExistentGachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }
    }

    @Nested
    @DisplayName("GET /gachas - 가챠 목록 조회 API")
    class ReadGachaList {

        @Test
        @DisplayName("가챠 목록 조회를 요청하면 200 OK와 페이징된 데이터 목록을 반환한다.")
        void readGacha_success() {
            // given
            createTargetGacha();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .param("page", 0)
                    .param("size", 10)
                    .when()
                    .get("/api/v1/gachas")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getList("data.content")).isNotEmpty();
        }

        @Test
        @DisplayName("키워드가 포함된 목록 조회를 요청하면 해당 키워드로 필터링된 목록을 반환한다.")
        void readGacha_withKeyword_success() {
            // given
            createTargetGacha("포켓몬 가챠");

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .param("keyword", "포켓몬")
                    .when()
                    .get("/api/v1/gachas")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getList("data.content")).isNotEmpty();
        }
    }

    @Nested
    @DisplayName("GET /gachas/{gachaId} - 가챠 단건 조회 API")
    class ReadGachaDetail {

        @Test
        @DisplayName("가챠 단건 조회에 성공하면 200 OK와 상세 정보를 반환한다.")
        void readGachaById_success() {
            // given
            Long gachaId = createTargetGacha();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .get("/api/v1/gachas/{gachaId}", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getLong("data.gachaId")).isEqualTo(gachaId);
        }

        @Test
        @DisplayName("존재하지 않는 가챠 ID 조회 시 404 Not Found를 반환한다.")
        void readGachaById_notFound() {
            // given
            Long nonExistentGachaId = 999999L;

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .get("/api/v1/gachas/{gachaId}", nonExistentGachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }
    }

    private Long createTargetGacha() {
        return createTargetGacha("테스트 가챠");
    }

    private Long createTargetGacha(String name) {
        Map<String, Object> request = Map.of(
                "name", name,
                "caption", "가챠 설명",
                "thumbnailUrl", "https://example.com/image.png"
        );

        return RestAssured.given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v1/gachas")
                .jsonPath()
                .getLong("data.gachaId");
    }
}

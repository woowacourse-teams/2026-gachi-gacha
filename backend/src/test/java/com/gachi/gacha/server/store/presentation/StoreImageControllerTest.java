package com.gachi.gacha.server.store.presentation;

import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreJpaRepository;
import com.gachi.gacha.server.store.infra.config.ImageUploader;
import io.restassured.RestAssured;
import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class StoreImageControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private StoreJpaRepository storeRepository;

    @MockitoBean
    private ImageUploader imageUploader;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        when(imageUploader.upload(any(), anyString()))
                .thenReturn("https://example.com/stores/test-image.jpg");
        doNothing().when(imageUploader).delete(anyString());
    }

    @Nested
    @DisplayName("GET /stores/{storeId}/images - 매장 이미지 목록 조회 API")
    class FindImages {

        @Test
        @DisplayName("등록된 이미지가 있으면 200 OK와 이미지 목록을 반환한다.")
        void findImages_success() {
            // given
            Long storeId = createTargetStore();
            createTargetStoreImage(storeId);

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .get("/api/v1/stores/{storeId}/images", storeId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C000");
            assertThat(response.jsonPath().getList("data.items")).isNotEmpty();
        }

        @Test
        @DisplayName("존재하지 않는 매장이면 404 Not Found를 반환한다.")
        void findImages_storeNotFound() {
            // given
            Long nonExistentStoreId = 999999L;

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .get("/api/v1/stores/{storeId}/images", nonExistentStoreId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }
    }

    @Nested
    @DisplayName("POST /stores/{storeId}/images - 매장 이미지 등록 API")
    class AddImage {

        @Test
        @DisplayName("이미지 파일을 첨부해 요청하면 201 Created와 Location 헤더를 반환한다.")
        void addImage_success() {
            // given
            Long storeId = createTargetStore();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("image", "image.png", "dummy-image-content".getBytes(), "image/png")
                    .when()
                    .post("/api/v1/stores/{storeId}/images", storeId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.CREATED.value());
            assertThat(response.header("Location")).isNotNull();
            assertThat(response.jsonPath().getString("code")).isEqualTo("C001");
            assertThat(response.jsonPath().getLong("data.storeImageId")).isNotNull();
        }

        @Test
        @DisplayName("존재하지 않는 매장이면 404 Not Found를 반환한다.")
        void addImage_storeNotFound() {
            // given
            Long nonExistentStoreId = 999999L;

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("image", "image.png", "dummy-image-content".getBytes(), "image/png")
                    .when()
                    .post("/api/v1/stores/{storeId}/images", nonExistentStoreId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }

        @Test
        @DisplayName("image 파트 없이 요청하면 400 Bad Request를 반환한다.")
        void addImage_missingImagePart() {
            // given
            Long storeId = createTargetStore();

            // when - 'image'가 아닌 다른 파트명으로 전송
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("file", "image.png", "dummy-image-content".getBytes(), "image/png")
                    .when()
                    .post("/api/v1/stores/{storeId}/images", storeId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        }
    }

    @Nested
    @DisplayName("PUT /stores/{storeId}/images/{storeImageId} - 매장 이미지 수정 API")
    class ModifyImage {

        @Test
        @DisplayName("이미지 수정에 성공하면 200 OK를 반환한다.")
        void modifyImage_success() {
            // given
            Long storeId = createTargetStore();
            Long storeImageId = createTargetStoreImage(storeId);

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("image", "new-image.png", "new-dummy-content".getBytes(), "image/png")
                    .when()
                    .put("/api/v1/stores/{storeId}/images/{storeImageId}", storeId, storeImageId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C002");
            assertThat(response.jsonPath().getLong("data.storeImageId")).isEqualTo(storeImageId);
        }

        @Test
        @DisplayName("존재하지 않는 이미지면 404 Not Found를 반환한다.")
        void modifyImage_notFound() {
            // given
            Long storeId = createTargetStore();
            Long nonExistentImageId = 999999L;

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("image", "new-image.png", "new-dummy-content".getBytes(), "image/png")
                    .when()
                    .put("/api/v1/stores/{storeId}/images/{storeImageId}", storeId, nonExistentImageId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }
    }

    @Nested
    @DisplayName("DELETE /stores/{storeId}/images/{storeImageId} - 매장 이미지 삭제 API")
    class RemoveImage {

        @Test
        @DisplayName("이미지 삭제에 성공하면 200 OK를 반환한다.")
        void removeImage_success() {
            // given
            Long storeId = createTargetStore();
            Long storeImageId = createTargetStoreImage(storeId);

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .delete("/api/v1/stores/{storeId}/images/{storeImageId}", storeId, storeImageId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C003");
            assertThat(response.jsonPath().getLong("data.storeImageId")).isEqualTo(storeImageId);
        }

        @Test
        @DisplayName("존재하지 않는 이미지면 404 Not Found를 반환한다.")
        void removeImage_notFound() {
            // given
            Long storeId = createTargetStore();
            Long nonExistentImageId = 999999L;

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .delete("/api/v1/stores/{storeId}/images/{storeImageId}", storeId, nonExistentImageId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }
    }

    private Long createTargetStore() {
        Store store = Store.builder()
                .thumbnailUrl("https://example.com/thumb.png")
                .latitude(37.5)
                .longitude(127.0)
                .build();

        return storeRepository.save(store).getId();
    }

    private Long createTargetStoreImage(final Long storeId) {
        return RestAssured.given()
                .multiPart("image", "seed-image.png", "seed-dummy-content".getBytes(), "image/png")
                .when()
                .post("/api/v1/stores/{storeId}/images", storeId)
                .jsonPath()
                .getLong("data.storeImageId");
    }
}

package com.gachi.gacha.server.gacha.presentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidValueException;
import com.gachi.gacha.server.common.infra.config.ImageUploader;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaImageJpaRepository;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GachaImageControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private GachaJpaRepository gachaRepository;

    @Autowired
    private GachaImageJpaRepository gachaImageRepository;

    @MockitoBean
    private ImageUploader imageUploader;

    @MockitoBean
    private RestTemplate restTemplate;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        when(imageUploader.upload(any(), anyString()))
                .thenReturn("https://example.com/gachas/test-image.jpg");
        doNothing().when(imageUploader).delete(anyString());
        doNothing().when(imageUploader).moveToTrash(anyString());
    }

    @Nested
    @DisplayName("GET /gachas/{gachaId}/images - 가챠 이미지 목록 조회 API")
    class FindImages {

        @Test
        @DisplayName("등록된 이미지가 있으면 200 OK와 이미지 목록을 반환한다.")
        void findImages_success() {
            // given
            Long gachaId = createTargetGacha();
            createTargetGachaImage(gachaId);

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .get("/api/v1/gachas/{gachaId}/images", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C000");
            assertThat(response.jsonPath().getList("data.items")).isNotEmpty();
        }

        @Test
        @DisplayName("존재하지 않는 가챠면 404 Not Found를 반환한다.")
        void findImages_gachaNotFound() {
            // given
            Long nonExistentGachaId = 999999L;

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .get("/api/v1/gachas/{gachaId}/images", nonExistentGachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }
    }

    @Nested
    @DisplayName("POST /gachas/{gachaId}/images - 가챠 이미지 등록 API")
    class AddImage {

        @Test
        @DisplayName("이미지 파일 하나를 첨부해 요청하면 201 Created와 등록된 이미지 목록을 반환한다.")
        void addImage_success() {
            // given
            Long gachaId = createTargetGacha();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("images", "image.png", "dummy-image-content".getBytes(), "image/png")
                    .when()
                    .post("/api/v1/gachas/{gachaId}/images", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.CREATED.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C001");
            assertThat(response.jsonPath().getList("data.items")).hasSize(1);
            assertThat(response.jsonPath().getLong("data.items[0].gachaImageId")).isNotNull();
        }

        @Test
        @DisplayName("이미지 파일 여러 개를 첨부해 요청하면 201 Created와 등록된 이미지 목록을 모두 반환한다.")
        void addImage_multiple_success() {
            // given
            Long gachaId = createTargetGacha();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("images", "image1.png", "dummy-image-content-1".getBytes(), "image/png")
                    .multiPart("images", "image2.png", "dummy-image-content-2".getBytes(), "image/png")
                    .multiPart("images", "image3.png", "dummy-image-content-3".getBytes(), "image/png")
                    .when()
                    .post("/api/v1/gachas/{gachaId}/images", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.CREATED.value());
            assertThat(response.jsonPath().getList("data.items")).hasSize(3);
        }

        @Test
        @DisplayName("업로드 중 하나라도 실패하면 이미 업로드된 이미지도 정리되고 전부 등록되지 않는다.")
        void addImage_partialFailure_rollsBackAll() {
            // given
            Long gachaId = createTargetGacha();

            when(imageUploader.upload(
                    argThat((MultipartFile file) -> file != null && "invalid.png".equals(file.getOriginalFilename())),
                    anyString()
            )).thenThrow(new InvalidValueException(ErrorCode.INVALID_GACHA_IMAGE_POLICY));

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("images", "image1.png", "dummy-image-content-1".getBytes(), "image/png")
                    .multiPart("images", "invalid.png", "dummy-image-content-2".getBytes(), "image/png")
                    .multiPart("images", "image3.png", "dummy-image-content-3".getBytes(), "image/png")
                    .when()
                    .post("/api/v1/gachas/{gachaId}/images", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
            assertThat(gachaImageRepository.findAllByGachaId(gachaId)).isEmpty();
        }

        @Test
        @DisplayName("존재하지 않는 가챠면 404 Not Found를 반환한다.")
        void addImage_gachaNotFound() {
            // given
            Long nonExistentGachaId = 999999L;

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("images", "image.png", "dummy-image-content".getBytes(), "image/png")
                    .when()
                    .post("/api/v1/gachas/{gachaId}/images", nonExistentGachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }

        @Test
        @DisplayName("images 파트 없이 요청하면 400 Bad Request를 반환한다.")
        void addImage_missingImagePart() {
            // given
            Long gachaId = createTargetGacha();

            // when - 'images'가 아닌 다른 파트명으로 전송
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("file", "image.png", "dummy-image-content".getBytes(), "image/png")
                    .when()
                    .post("/api/v1/gachas/{gachaId}/images", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        }
    }

    @Nested
    @DisplayName("PUT /gachas/{gachaId}/images/{gachaImageId} - 가챠 이미지 수정 API")
    class ModifyImage {

        @Test
        @DisplayName("이미지 수정에 성공하면 200 OK를 반환한다.")
        void modifyImage_success() {
            // given
            Long gachaId = createTargetGacha();
            Long gachaImageId = createTargetGachaImage(gachaId);

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("image", "new-image.png", "new-dummy-content".getBytes(), "image/png")
                    .when()
                    .put("/api/v1/gachas/{gachaId}/images/{gachaImageId}", gachaId, gachaImageId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C002");
            assertThat(response.jsonPath().getLong("data.gachaImageId")).isEqualTo(gachaImageId);
        }

        @Test
        @DisplayName("존재하지 않는 이미지면 404 Not Found를 반환한다.")
        void modifyImage_notFound() {
            // given
            Long gachaId = createTargetGacha();
            Long nonExistentImageId = 999999L;

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("image", "new-image.png", "new-dummy-content".getBytes(), "image/png")
                    .when()
                    .put("/api/v1/gachas/{gachaId}/images/{gachaImageId}", gachaId, nonExistentImageId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }
    }

    @Nested
    @DisplayName("DELETE /gachas/{gachaId}/images/{gachaImageId} - 가챠 이미지 삭제 API")
    class RemoveImage {

        @Test
        @DisplayName("이미지 삭제에 성공하면 200 OK를 반환한다.")
        void removeImage_success() {
            // given
            Long gachaId = createTargetGacha();
            Long gachaImageId = createTargetGachaImage(gachaId);

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .delete("/api/v1/gachas/{gachaId}/images/{gachaImageId}", gachaId, gachaImageId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C003");
            assertThat(response.jsonPath().getLong("data.gachaImageId")).isEqualTo(gachaImageId);
        }

        @Test
        @DisplayName("존재하지 않는 이미지면 404 Not Found를 반환한다.")
        void removeImage_notFound() {
            // given
            Long gachaId = createTargetGacha();
            Long nonExistentImageId = 999999L;

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .delete("/api/v1/gachas/{gachaId}/images/{gachaImageId}", gachaId, nonExistentImageId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }
    }

    private Long createTargetGacha() {
        Gacha gacha = Gacha.builder()
                .name("테스트 가챠")
                .caption("가챠 설명")
                .thumbnailUrl("https://example.com/image.png")
                .build();

        return gachaRepository.save(gacha).getId();
    }

    private Long createTargetGachaImage(final Long gachaId) {
        return RestAssured.given()
                .multiPart("images", "seed-image.png", "seed-dummy-content".getBytes(), "image/png")
                .when()
                .post("/api/v1/gachas/{gachaId}/images", gachaId)
                .jsonPath()
                .getLong("data.items[0].gachaImageId");
    }
}

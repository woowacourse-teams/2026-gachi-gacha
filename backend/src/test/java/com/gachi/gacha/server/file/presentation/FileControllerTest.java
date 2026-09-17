package com.gachi.gacha.server.file.presentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.gachi.gacha.server.common.auth.jwt.JwtProvider;
import com.gachi.gacha.server.common.infra.application.MultipartUploader;
import com.gachi.gacha.server.common.infra.domain.DomainType;
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
import org.springframework.web.multipart.MultipartFile;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class FileControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private JwtProvider jwtProvider;

    @MockitoBean
    private MultipartUploader multipartUploader;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
    }

    @Nested
    @DisplayName("POST /files - 파일 업로드 API")
    class UploadFiles {

        @Test
        @DisplayName("인증된 사용자가 여러 파일을 올리면 200 OK와 각 파일의 업로드 결과를 반환한다.")
        void uploadFiles_success() {
            // given
            when(multipartUploader.upload(any(MultipartFile.class), any(DomainType.class)))
                    .thenReturn("https://cdn.example.com/files/uuid-1.jpg")
                    .thenReturn("https://cdn.example.com/files/uuid-2.mp4");
            String accessToken = jwtProvider.createToken(1L);

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .header("Authorization", "Bearer " + accessToken)
                    .multiPart("files", "kuromi.jpg", "dummy-image-content".getBytes(), "image/jpeg")
                    .multiPart("files", "clip.mp4", "dummy-video-content".getBytes(), "video/mp4")
                    .when()
                    .post("/api/v1/files")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C000");
            assertThat(response.jsonPath().getList("data.files")).hasSize(2);
            assertThat(response.jsonPath().getString("data.files[0].url"))
                    .isEqualTo("https://cdn.example.com/files/uuid-1.jpg");
            assertThat(response.jsonPath().getString("data.files[0].originalName")).isEqualTo("kuromi.jpg");
            assertThat(response.jsonPath().getString("data.files[0].contentType")).isEqualTo("image/jpeg");
            assertThat(response.jsonPath().getString("data.files[1].originalName")).isEqualTo("clip.mp4");
        }

        @Test
        @DisplayName("인증 토큰 없이 요청하면 401을 반환한다.")
        void uploadFiles_withoutToken_returnsUnauthorized() {
            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("files", "kuromi.jpg", "dummy-image-content".getBytes(), "image/jpeg")
                    .when()
                    .post("/api/v1/files")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        }
    }
}

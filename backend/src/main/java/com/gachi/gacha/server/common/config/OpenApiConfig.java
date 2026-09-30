package com.gachi.gacha.server.common.config;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.exception.dto.ErrorResponse;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.utils.SpringDocUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * API 문서 설정.
 *
 * <p>문서 노출 여부는 이 클래스가 아니라 {@code application.yaml} 의
 * {@code springdoc.api-docs.enabled} / {@code springdoc.swagger-ui.enabled} 가 결정한다
 * (기본값 false, 환경변수 {@code SWAGGER_ENABLED} 로 켠다).
 */
@Configuration(proxyBeanMethods = false)
@OpenAPIDefinition(
        info = @Info(
                title = "가치가챠 API",
                version = "v1",
                description = """
                        가챠 정보 공유와 교환 게시글 서비스의 API 문서입니다.

                        ## 응답 형식
                        모든 성공 응답은 `code` / `message` / `data` 로 감싸집니다.

                        ```json
                        { "code": "C000", "message": "정상", "data": { } }
                        ```

                        | code | 상황 |
                        |------|------|
                        | C000 | 조회 성공 (200) |
                        | C001 | 생성 성공 (201) |
                        | C002 | 수정 성공 (204) |
                        | C003 | 삭제 성공 (204) |

                        ## 오류 형식
                        오류는 `ErrorResponse` 스키마로 내려갑니다. 아래 Schemas 항목에서 구조를 확인할 수 있습니다.
                        `code` 는 도메인별 접두어를 가집니다 — 공통 `CE`, 가챠 `GE`, 매장 `SE`,
                        회원·인증 `AUE`, 채팅 `CHE`, 교환 게시글 `TE`, 파일 `FE`, S3 `S3E`.

                        입력값 검증 실패(`CE001`)일 때만 `errors` 에 필드별 사유가 함께 담깁니다.

                        ## 인증
                        자물쇠 표시가 있는 API 는 `Authorization: Bearer {accessToken}` 헤더가 필요합니다.
                        우측 상단 **Authorize** 에 accessToken 을 넣으면 이후 요청에 자동으로 붙습니다.

                        ## 문서에 없는 것
                        채팅 실시간 통신(STOMP over WebSocket)은 OpenAPI 범위가 아니라 여기에 나타나지 않습니다.
                        """
        )
)
@SecurityScheme(
        name = OpenApiConfig.BEARER_AUTH,
        type = SecuritySchemeType.HTTP,
        in = SecuritySchemeIn.HEADER,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "로그인 응답으로 받은 accessToken 을 그대로 입력한다. 'Bearer ' 접두어는 붙이지 않는다."
)
public class OpenApiConfig {

    public static final String BEARER_AUTH = "bearerAuth";

    static {
        // @Auth 는 AuthArgumentResolver 가 토큰에서 채워 넣는 파라미터다.
        // springdoc 은 커스텀 ArgumentResolver 를 모르기 때문에, 알려주지 않으면
        // memberId 를 쿼리 파라미터로 오해해 문서에 넣는다(해당 엔드포인트 16개).
        SpringDocUtils.getConfig().addAnnotationsToIgnore(Auth.class);
    }

    /**
     * 오류 응답 구조를 Schemas 목록에 등록한다.
     *
     * <p>엔드포인트별로 어떤 오류가 나는지는 매핑하지 않는다. 그 매핑이 코드에 문서화되어 있지 않아
     * 지금 단계에서 적으면 추측이 섞이기 때문이다. 구조만 공통으로 보여준다.
     */
    @Bean
    public OpenApiCustomizer errorResponseSchemaCustomizer() {
        return openApi -> {
            Components components = openApi.getComponents();
            if (components == null) {
                components = new Components();
                openApi.setComponents(components);
            }

            ModelConverters.getInstance()
                    .readAll(ErrorResponse.class)
                    .forEach(components::addSchemas);
        };
    }
}

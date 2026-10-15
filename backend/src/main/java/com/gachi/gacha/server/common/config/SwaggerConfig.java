package com.gachi.gacha.server.common.config;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.exception.dto.ErrorResponse;
import com.gachi.gacha.server.common.web.ClientIp;
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
                        | C002 | 수정 성공 (200) |
                        | C003 | 삭제 성공 (200) |

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
        name = SwaggerConfig.BEARER_AUTH,
        type = SecuritySchemeType.HTTP,
        in = SecuritySchemeIn.HEADER,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "로그인 응답으로 받은 accessToken 을 그대로 입력한다. 'Bearer ' 접두어는 붙이지 않는다."
)
public class SwaggerConfig {

    public static final String BEARER_AUTH = "bearerAuth";

    static {
        SpringDocUtils.getConfig().addAnnotationsToIgnore(Auth.class, ClientIp.class);
    }

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

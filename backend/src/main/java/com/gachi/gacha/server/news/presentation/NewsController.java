package com.gachi.gacha.server.news.presentation;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.config.SwaggerConfig;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.news.application.NewsService;
import com.gachi.gacha.server.news.presentation.dto.NewsNewResponse;
import com.gachi.gacha.server.news.presentation.dto.NewsPageResponse;
import com.gachi.gacha.server.news.presentation.dto.NewsSubscriptionRequest;
import com.gachi.gacha.server.news.presentation.dto.NewsSubscriptionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "신상 소식", description = "알림 화면의 신상 소식 탭: 소식 목록, 새 소식 표시, 푸시 알림 구독")
@SecurityRequirement(name = SwaggerConfig.BEARER_AUTH)
@RestController
@RequestMapping("/news/{topic}")
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    @Operation(summary = "신상 소식 목록 조회",
            description = "끝나지 않은 소식(행사 시작이 빠른 순)이 위, 끝난 소식(ENDED)이 아래다. 끝난 지 30일이 지나면 숨긴다.")
    @GetMapping
    public BaseResponse<NewsPageResponse> getItems(
            @Auth final Long memberId,
            @Parameter(description = "주제", example = "CHIIKAWA") @PathVariable final String topic,
            @Parameter(description = "페이지 번호 (0부터)", example = "0") @RequestParam(defaultValue = "0") final int page,
            @Parameter(description = "한 번에 가져올 개수 (최대 100)", example = "20") @RequestParam(defaultValue = "20") final int size
    ) {
        return BaseResponse.ok(NewsPageResponse.from(newsService.getItems(topic, page, size)));
    }

    @Operation(summary = "새 소식 여부 조회", description = "탭을 마지막으로 본 뒤에 공개된 소식이 있는지 알려준다.")
    @GetMapping("/new")
    public BaseResponse<NewsNewResponse> hasNew(
            @Auth final Long memberId,
            @Parameter(description = "주제", example = "CHIIKAWA") @PathVariable final String topic
    ) {
        return BaseResponse.ok(new NewsNewResponse(newsService.hasNew(memberId, topic)));
    }

    @Operation(summary = "신상 소식 탭 확인 기록", description = "탭을 봤다고 기록한다. 이후 새 소식 여부는 이 시각 이후에 공개된 소식만 센다.")
    @PutMapping("/viewed")
    public BaseResponse<Void> markViewed(
            @Auth final Long memberId,
            @Parameter(description = "주제", example = "CHIIKAWA") @PathVariable final String topic
    ) {
        newsService.markViewed(memberId, topic);
        return BaseResponse.updated(null);
    }

    @Operation(summary = "신상 소식 알림 구독 조회", description = "기본값은 구독하지 않음이다.")
    @GetMapping("/subscription")
    public BaseResponse<NewsSubscriptionResponse> getSubscription(
            @Auth final Long memberId,
            @Parameter(description = "주제", example = "CHIIKAWA") @PathVariable final String topic
    ) {
        return BaseResponse.ok(new NewsSubscriptionResponse(newsService.isSubscribed(memberId, topic)));
    }

    @Operation(summary = "신상 소식 알림 구독 변경", description = "푸시 알림을 켜거나 끈다. 이미 그 상태면 그대로 성공으로 처리한다.")
    @PutMapping("/subscription")
    public BaseResponse<NewsSubscriptionResponse> setSubscription(
            @Auth final Long memberId,
            @Parameter(description = "주제", example = "CHIIKAWA") @PathVariable final String topic,
            @Valid @RequestBody final NewsSubscriptionRequest request
    ) {
        return BaseResponse.updated(new NewsSubscriptionResponse(
                newsService.setSubscribed(memberId, topic, request.subscribed())));
    }
}

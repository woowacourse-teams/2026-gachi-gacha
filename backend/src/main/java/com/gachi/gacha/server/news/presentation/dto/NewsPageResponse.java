package com.gachi.gacha.server.news.presentation.dto;

import com.gachi.gacha.server.news.application.dto.NewsPageInfo;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "신상 소식 목록 한 페이지")
public record NewsPageResponse(
        @Schema(description = "소식 목록. 끝나지 않은 소식이 위, 끝난 소식(ENDED)이 아래") List<NewsItemResponse> items,
        @Schema(description = "다음 페이지가 있는지") boolean hasNext
) {
    public static NewsPageResponse from(final NewsPageInfo info) {
        return new NewsPageResponse(info.items().stream().map(NewsItemResponse::from).toList(), info.hasNext());
    }
}

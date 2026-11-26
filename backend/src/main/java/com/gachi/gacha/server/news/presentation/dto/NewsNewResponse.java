package com.gachi.gacha.server.news.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "새 소식 여부")
public record NewsNewResponse(
        @Schema(description = "탭을 마지막으로 본 뒤에 공개된 소식이 있는지") boolean hasNew
) {
}

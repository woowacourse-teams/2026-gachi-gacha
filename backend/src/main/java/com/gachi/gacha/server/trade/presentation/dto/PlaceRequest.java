package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.domain.Place;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Schema(
        description = """
                장소 정보. 프론트가 카카오 지도 SDK 에서 고른 값을 그대로 보낸다.
                서버는 카카오 API 를 호출하지 않고 받은 값을 저장한다.

                좌표는 한국 범위(위도 33~39, 경도 124~132)를 벗어나면 거부한다."""
)
@Builder
public record PlaceRequest(
        @Schema(
                description = "장소 이름. 지도에서 고른 곳이면 상호명이 들어가고, 주소만 입력한 경우 생략한다.",
                example = "다이소 홍대점"
        )
        @Size(max = 255)
        @Nullable String name,

        @Schema(
                description = "주소",
                example = "서울특별시 마포구 양화로 156",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotBlank
        @Size(max = 255)
        String address,

        @Schema(
                description = "위도. 경도와 바꿔 넣지 않도록 주의한다.",
                example = "37.5563",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotNull
        Double latitude,

        @Schema(
                description = "경도",
                example = "126.9236",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotNull
        Double longitude
) {
    public Place toPlace() {
        return new Place(name, address, latitude, longitude);
    }
}

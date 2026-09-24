package com.gachi.gacha.server.trade.presentation.dto;

import com.gachi.gacha.server.trade.domain.Place;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

/**
 * 프론트가 카카오맵 SDK에서 사용자가 고른 장소의 값을 그대로 보낸다. 서버는 카카오 API를 호출하지 않는다.
 * <p>
 * 장소 자체는 보내지 않아도 되지만, 보낼 경우 주소와 위경도가 모두 있어야 한다. 여기서는 "값이 왔는지"와 길이를 보고,
 * 좌표가 실제로 국내 범위인지는 {@link Place}가 검증한다.
 */
@Builder
public record PlaceRequest(
        @Size(max = 255)
        @Nullable String name,

        @NotBlank
        @Size(max = 255)
        String address,

        @NotNull
        Double latitude,

        @NotNull
        Double longitude
) {
    public Place toPlace() {
        return new Place(name, address, latitude, longitude);
    }
}

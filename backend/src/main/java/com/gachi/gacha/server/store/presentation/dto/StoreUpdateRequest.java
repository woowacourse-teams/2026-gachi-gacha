package com.gachi.gacha.server.store.presentation.dto;

import com.gachi.gacha.server.store.application.dto.StoreUpdateCommand;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;

public record StoreUpdateRequest(
        @Size(max = 255, message = "매장 이름은 255자를 초과할 수 없습니다.")
        @Pattern(regexp = ".*\\S.*", message = "매장 이름은 공백일 수 없습니다.")
        String name,

        @Size(max = 255, message = "썸네일 URL은 255자를 초과할 수 없습니다.")
        String thumbnailUrl,

        @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다.")
        @DecimalMax(value = "90.0", message = "위도는 90 이하여야 합니다.")
        Double latitude,

        @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다.")
        @DecimalMax(value = "180.0", message = "경도는 180 이하여야 합니다.")
        Double longitude,

        @Size(max = 255, message = "전화번호는 255자를 초과할 수 없습니다.")
        String phoneNumber,

        @Size(max = 255, message = "인스타그램 ID는 255자를 초과할 수 없습니다.")
        String instagramId,

        @Size(max = 255, message = "매장 주소는 255자를 초과할 수 없습니다.")
        @Pattern(regexp = ".*\\S.*", message = "매장 주소는 공백일 수 없습니다.")
        String address,

        Integer floor,

        @Size(max = 255, message = "호수 또는 점포 번호는 255자를 초과할 수 없습니다.")
        @Pattern(regexp = ".*\\S.*", message = "호수 또는 점포 번호는 공백일 수 없습니다.")
        String unit,

        @Size(max = 255, message = "영업시간은 255자를 초과할 수 없습니다.")
        String businessHours,

        @Size(max = 255, message = "결제 방법은 255자를 초과할 수 없습니다.")
        String paymentMethods,

        @PositiveOrZero(message = "가챠 기계 수는 0 이상이어야 합니다.")
        Integer gachaMachineAmount,

        @PositiveOrZero(message = "동전 가격은 0 이상이어야 합니다.")
        Long coinPrice,

        @PositiveOrZero(message = "가챠 최소 가격은 0 이상이어야 합니다.")
        Long gachaPriceMin,

        @PositiveOrZero(message = "가챠 최대 가격은 0 이상이어야 합니다.")
        Long gachaPriceMax,

        @PositiveOrZero(message = "쿠지 수는 0 이상이어야 합니다.")
        Integer kujiAmount,

        @PositiveOrZero(message = "쿠지 최소 가격은 0 이상이어야 합니다.")
        Long kujiPriceMin,

        @PositiveOrZero(message = "쿠지 최대 가격은 0 이상이어야 합니다.")
        Long kujiPriceMax,

        Boolean hasSelectGacha,

        @PositiveOrZero(message = "셀렉트 가챠 최소 가격은 0 이상이어야 합니다.")
        Long selectGachaPriceMin,

        @PositiveOrZero(message = "셀렉트 가챠 최대 가격은 0 이상이어야 합니다.")
        Long selectGachaPriceMax,

        List<@NotBlank(message = "편의시설은 빈 값일 수 없습니다.") String> facilities,

        Boolean hasRandomBox
) {

    public StoreUpdateCommand toCommand() {
        return new StoreUpdateCommand(
                name,
                thumbnailUrl,
                latitude,
                longitude,
                phoneNumber,
                instagramId,
                address,
                floor,
                unit,
                businessHours,
                paymentMethods,
                gachaMachineAmount,
                coinPrice,
                gachaPriceMin,
                gachaPriceMax,
                kujiAmount,
                kujiPriceMin,
                kujiPriceMax,
                hasSelectGacha,
                selectGachaPriceMin,
                selectGachaPriceMax,
                facilities,
                hasRandomBox
        );
    }
}

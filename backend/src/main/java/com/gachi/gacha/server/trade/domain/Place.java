package com.gachi.gacha.server.trade.domain;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.trade.domain.exception.InvalidTradeException;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Embeddable
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Place {

    private static final int MAX_LENGTH = 255;

    /**
     * 국내 서비스라 세계 좌표 범위(-90~90, -180~180) 대신 한반도 범위로 좁힌다. 범위를 좁히면 위도와 경도를
     * 바꿔 보내는 실수까지 걸러낼 수 있다. 마라도(33.06), 백령도(124.6), 독도(131.87)를 포함하는 범위다.
     */
    private static final double MIN_LATITUDE = 33.0;
    private static final double MAX_LATITUDE = 39.0;
    private static final double MIN_LONGITUDE = 124.0;
    private static final double MAX_LONGITUDE = 132.0;

    private String name;
    private String address;
    private Double latitude;
    private Double longitude;

    /**
     * @param name 상호명이 없는 지점(주소만 있는 곳, 지도에서 임의로 찍은 좌표)도 선택할 수 있어 선택값이다.
     *             비어 있으면 {@code null}로 저장하고, 화면에서는 주소를 대신 표시하는 것을 전제로 한다.
     */
    public Place(final String name, final String address, final Double latitude, final Double longitude) {
        validateAddress(address);
        validateCoordinates(latitude, longitude);
        validateNameLength(name);

        this.name = isBlank(name) ? null : name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    private void validateAddress(final String address) {
        if (isBlank(address) || address.length() > MAX_LENGTH) {
            throw new InvalidTradeException(ErrorCode.INVALID_TRADE_POLICY);
        }
    }

    private void validateCoordinates(final Double latitude, final Double longitude) {
        if (latitude == null || latitude < MIN_LATITUDE || latitude > MAX_LATITUDE) {
            throw new InvalidTradeException(ErrorCode.INVALID_TRADE_POLICY);
        }
        if (longitude == null || longitude < MIN_LONGITUDE || longitude > MAX_LONGITUDE) {
            throw new InvalidTradeException(ErrorCode.INVALID_TRADE_POLICY);
        }
    }

    private void validateNameLength(final String name) {
        if (name != null && name.length() > MAX_LENGTH) {
            throw new InvalidTradeException(ErrorCode.INVALID_TRADE_POLICY);
        }
    }

    private boolean isBlank(final String value) {
        return value == null || value.isBlank();
    }
}

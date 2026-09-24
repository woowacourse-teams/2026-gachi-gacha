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

    private static final double MIN_LATITUDE = 33.0;
    private static final double MAX_LATITUDE = 39.0;
    private static final double MIN_LONGITUDE = 124.0;
    private static final double MAX_LONGITUDE = 132.0;

    private String name;
    private String address;
    private Double latitude;
    private Double longitude;

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

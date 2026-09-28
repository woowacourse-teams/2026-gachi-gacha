package com.gachi.gacha.server.trade.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.trade.domain.exception.InvalidTradeException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class PlaceTest {

    private static final String ADDRESS = "서울특별시 마포구 양화로 160";
    private static final double LATITUDE = 37.5570;
    private static final double LONGITUDE = 126.9245;

    @Nested
    @DisplayName("이름")
    class Name {

        @Test
        @DisplayName("상호명이 있으면 그대로 저장한다.")
        void keepsName() {
            Place place = new Place("홍대입구역 8번 출구", ADDRESS, LATITUDE, LONGITUDE);

            assertThat(place.getName()).isEqualTo("홍대입구역 8번 출구");
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"   "})
        @DisplayName("상호명이 없는 지점도 등록할 수 있고, 비어 있으면 null 로 저장한다.")
        void allowsBlankName(final String name) {
            Place place = new Place(name, ADDRESS, LATITUDE, LONGITUDE);

            assertThat(place.getName()).isNull();
        }

        @Test
        @DisplayName("이름이 255자를 넘으면 거부한다.")
        void rejectsTooLongName() {
            String tooLongName = "가".repeat(256);

            assertThatThrownBy(() -> new Place(tooLongName, ADDRESS, LATITUDE, LONGITUDE))
                    .isInstanceOf(InvalidTradeException.class)
                    .hasMessage(ErrorCode.INVALID_TRADE_POLICY.getMessage());
        }
    }

    @Nested
    @DisplayName("주소")
    class Address {

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"   "})
        @DisplayName("주소가 없으면 거부한다.")
        void rejectsBlankAddress(final String address) {
            assertThatThrownBy(() -> new Place("홍대입구역 8번 출구", address, LATITUDE, LONGITUDE))
                    .isInstanceOf(InvalidTradeException.class);
        }

        @Test
        @DisplayName("주소가 255자를 넘으면 거부한다.")
        void rejectsTooLongAddress() {
            String tooLongAddress = "가".repeat(256);

            assertThatThrownBy(() -> new Place("홍대입구역 8번 출구", tooLongAddress, LATITUDE, LONGITUDE))
                    .isInstanceOf(InvalidTradeException.class);
        }
    }

    @Nested
    @DisplayName("좌표")
    class Coordinates {

        @ParameterizedTest
        @CsvSource({
                "33.0, 124.0",
                "39.0, 132.0",
                "33.06, 126.27",
                "37.4979, 127.0276"
        })
        @DisplayName("국내 범위의 좌표는 경계값을 포함해 허용한다.")
        void allowsDomesticCoordinates(final double latitude, final double longitude) {
            assertThatCode(() -> new Place("어딘가", ADDRESS, latitude, longitude))
                    .doesNotThrowAnyException();
        }

        @ParameterizedTest
        @CsvSource({
                "32.9, 126.9245",
                "39.1, 126.9245",
                "37.5570, 123.9",
                "37.5570, 132.1",
                "35.6812, 139.7671"
        })
        @DisplayName("국내 범위를 벗어난 좌표는 거부한다.")
        void rejectsOutOfRangeCoordinates(final double latitude, final double longitude) {
            assertThatThrownBy(() -> new Place("어딘가", ADDRESS, latitude, longitude))
                    .isInstanceOf(InvalidTradeException.class);
        }

        @Test
        @DisplayName("위도와 경도를 바꿔 보내면 거부한다. 범위를 국내로 좁힌 이유다.")
        void rejectsSwappedCoordinates() {
            assertThatThrownBy(() -> new Place("서울시청", ADDRESS, LONGITUDE, LATITUDE))
                    .isInstanceOf(InvalidTradeException.class);
        }

        @Test
        @DisplayName("주소만 있고 위도가 없으면 거부한다. 장소를 넣을 거면 주소와 좌표가 모두 있어야 한다.")
        void rejectsMissingLatitude() {
            assertThatThrownBy(() -> new Place("홍대입구역 8번 출구", ADDRESS, null, LONGITUDE))
                    .isInstanceOf(InvalidTradeException.class);
        }

        @Test
        @DisplayName("주소만 있고 경도가 없으면 거부한다.")
        void rejectsMissingLongitude() {
            assertThatThrownBy(() -> new Place("홍대입구역 8번 출구", ADDRESS, LATITUDE, null))
                    .isInstanceOf(InvalidTradeException.class);
        }
    }
}

package com.gachi.gacha.server.common.web;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class ClientIpMaskerTest {

    @ParameterizedTest
    @CsvSource({
            "118.44.23.1, 118.44",
            "127.0.0.1, 127.0",
            "8.8.8.8, 8.8"
    })
    @DisplayName("IPv4 는 앞 두 옥텟만 남긴다.")
    void masksIpv4(final String ip, final String expected) {
        assertThat(ClientIpMasker.mask(ip)).isEqualTo(expected);
    }

    @ParameterizedTest
    @CsvSource({
            "2001:0db8:85a3:0000:0000:8a2e:0370:7334, 2001:0db8",
            "0:0:0:0:0:0:0:1, 0:0"
    })
    @DisplayName("IPv6 는 앞 두 그룹만 남긴다. 로컬 루프백도 같은 규칙을 탄다.")
    void masksIpv6(final String ip, final String expected) {
        assertThat(ClientIpMasker.mask(ip)).isEqualTo(expected);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    @DisplayName("IP 를 알 수 없으면 기본값을 쓴다.")
    void fallsBackWhenUnknown(final String ip) {
        assertThat(ClientIpMasker.mask(ip)).isEqualTo("0.0");
    }

    @ParameterizedTest
    @ValueSource(strings = {"localhost", "118"})
    @DisplayName("조각이 둘에 못 미치면 그대로 둔다.")
    void keepsShortValue(final String ip) {
        assertThat(ClientIpMasker.mask(ip)).isEqualTo(ip);
    }
}

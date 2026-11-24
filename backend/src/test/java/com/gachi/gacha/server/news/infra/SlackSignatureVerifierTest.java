package com.gachi.gacha.server.news.infra;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class SlackSignatureVerifierTest {

    /**
     * 슬랙 문서의 서명 검증 예시 값. 실제 비밀값이 아니다.
     */
    private static final String SECRET = "8f742231b10e8888abcd99yyyzzz85a5";
    private static final String TIMESTAMP = "1531420618";
    private static final byte[] BODY = ("token=xyzz0WbapA4vBCDEFasx0q6G&team_id=T1DC2JH3J&team_domain=testteamnow"
            + "&channel_id=G8PSS9T3V&channel_name=foobar&user_id=U2CERLKJA&user_name=roadrunner&command=%2Fwebhook-collect"
            + "&text=&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT1DC2JH3J%2F397700885554%2F96rGlfmibIGlgcZRskXaIFfN"
            + "&trigger_id=398738663015.47445629121.803a0bc887a14d10d2c447fce8b6703c").getBytes(StandardCharsets.UTF_8);
    private static final String SIGNATURE = "v0=a2114d57b48eac39b9ad189dd8316235a7b4a8d21a10bd27519666489c69b503";
    private static final Instant NOW = Instant.ofEpochSecond(Long.parseLong(TIMESTAMP));

    private final SlackSignatureVerifier verifier = new SlackSignatureVerifier(SECRET);

    @Test
    @DisplayName("원본 본문으로 계산한 서명이 같으면 통과한다 (슬랙 문서 예시)")
    void acceptsValidSignature() {
        assertThat(verifier.verify(TIMESTAMP, SIGNATURE, BODY, NOW)).isTrue();
        assertThat(verifier.verify(TIMESTAMP, SIGNATURE, BODY, NOW.plus(Duration.ofMinutes(5)))).isTrue();
    }

    @Test
    @DisplayName("서명이 다르거나 본문이 한 글자라도 바뀌면 거부한다")
    void rejectsMismatch() {
        byte[] tampered = new String(BODY, StandardCharsets.UTF_8).replace("roadrunner", "roadrunnex")
                .getBytes(StandardCharsets.UTF_8);

        assertThat(verifier.verify(TIMESTAMP, SIGNATURE.replace("a2114", "a2115"), BODY, NOW)).isFalse();
        assertThat(verifier.verify(TIMESTAMP, SIGNATURE, tampered, NOW)).isFalse();
        assertThat(new SlackSignatureVerifier("other-secret").verify(TIMESTAMP, SIGNATURE, BODY, NOW)).isFalse();
    }

    @Test
    @DisplayName("타임스탬프가 지금과 5분 넘게 차이 나면 서명이 맞아도 거부한다")
    void rejectsOldOrFutureTimestamp() {
        assertThat(verifier.verify(TIMESTAMP, SIGNATURE, BODY, NOW.plus(Duration.ofMinutes(5).plusSeconds(1)))).isFalse();
        assertThat(verifier.verify(TIMESTAMP, SIGNATURE, BODY, NOW.minus(Duration.ofMinutes(5).plusSeconds(1)))).isFalse();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"abc", "15314.20618"})
    @DisplayName("타임스탬프가 없거나 숫자가 아니면 거부한다")
    void rejectsMalformedTimestamp(final String timestamp) {
        assertThat(verifier.verify(timestamp, SIGNATURE, BODY, NOW)).isFalse();
    }

    @Test
    @DisplayName("서명 헤더가 없거나 Signing Secret 이 설정되지 않았으면 거부한다")
    void rejectsMissingSignatureOrSecret() {
        assertThat(verifier.verify(TIMESTAMP, null, BODY, NOW)).isFalse();
        assertThat(new SlackSignatureVerifier(null).verify(TIMESTAMP, SIGNATURE, BODY, NOW)).isFalse();
        assertThat(new SlackSignatureVerifier(" ").verify(TIMESTAMP, SIGNATURE, BODY, NOW)).isFalse();
    }
}

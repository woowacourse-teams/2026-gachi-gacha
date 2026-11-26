package com.gachi.gacha.server.news.infra;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.jspecify.annotations.Nullable;

/**
 * 슬랙 요청 서명 검증. 버튼 수신 엔드포인트는 회원 인증이 없으므로 이 검증으로만 보호한다.
 *
 * <ul>
 *   <li>X-Slack-Request-Timestamp 가 지금과 5분 넘게 차이 나면 거부한다 (재전송 공격 방지)</li>
 *   <li>"v0:{timestamp}:{원본 요청 본문}" 을 Signing Secret 으로 HMAC-SHA256 한 값과 X-Slack-Signature 를 상수 시간 비교한다</li>
 *   <li>본문은 파싱하기 전의 원본 바이트를 쓴다. 파라미터로 다시 조립하면 인코딩이 달라져 서명이 맞지 않을 수 있다</li>
 * </ul>
 */
public class SlackSignatureVerifier {

    private static final Duration MAX_AGE = Duration.ofMinutes(5);
    private static final String VERSION = "v0";
    private static final String ALGORITHM = "HmacSHA256";

    private final @Nullable String signingSecret;

    public SlackSignatureVerifier(@Nullable final String signingSecret) {
        this.signingSecret = signingSecret;
    }

    public boolean verify(
            @Nullable final String timestamp,
            @Nullable final String signature,
            final byte[] rawBody,
            final Instant now
    ) {
        if (signingSecret == null || signingSecret.isBlank() || timestamp == null || signature == null) {
            return false;
        }
        long seconds;
        try {
            seconds = Long.parseLong(timestamp);
        } catch (NumberFormatException e) {
            return false;
        }
        if (Duration.between(Instant.ofEpochSecond(seconds), now).abs().compareTo(MAX_AGE) > 0) {
            return false;
        }
        byte[] expected = (VERSION + "=" + hmac(VERSION + ":" + timestamp + ":", rawBody))
                .getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, signature.getBytes(StandardCharsets.UTF_8));
    }

    private String hmac(final String prefix, final byte[] rawBody) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(signingSecret.getBytes(StandardCharsets.UTF_8), ALGORITHM));
            mac.update(prefix.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(mac.doFinal(rawBody));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("슬랙 서명 계산 실패", e);
        }
    }
}

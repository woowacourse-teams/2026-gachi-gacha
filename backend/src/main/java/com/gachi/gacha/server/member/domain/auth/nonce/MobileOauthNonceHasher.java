package com.gachi.gacha.server.member.domain.auth.nonce;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import org.springframework.stereotype.Component;

@Component
public class MobileOauthNonceHasher {

    public String hash(final String nonce) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(nonce.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 알고리즘을 사용할 수 없습니다.", e);
        }
    }
}

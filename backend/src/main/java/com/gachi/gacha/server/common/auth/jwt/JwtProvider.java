package com.gachi.gacha.server.common.auth.jwt;

import static java.util.concurrent.TimeUnit.MILLISECONDS;
import static java.util.concurrent.TimeUnit.MINUTES;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.UnAuthorizationException;
import java.util.Date;
import org.springframework.stereotype.Service;

@Service
public class JwtProvider {

    private static final String MEMBER_ID_CLAIM = "memberId";
    private static final String TYPE_CLAIM = "type";
    private static final String ACCESS_TYPE = "access";

    private final long accessTokenExpirationMills;
    private final Algorithm algorithm;

    public JwtProvider(final JwtProperty jwtProperty) {
        this.accessTokenExpirationMills = MILLISECONDS.convert(jwtProperty.accessTokenExpirationMinutes(), MINUTES);
        this.algorithm = Algorithm.HMAC256(jwtProperty.secretKey());
    }

    public String createToken(final Long memberId) {
        long now = System.currentTimeMillis();
        return JWT.create()
                .withIssuedAt(new Date(now))
                .withExpiresAt(new Date(now + accessTokenExpirationMills))
                .withClaim(MEMBER_ID_CLAIM, memberId)
                .withClaim(TYPE_CLAIM, ACCESS_TYPE)
                .sign(algorithm);
    }

    public Long extractMemberId(final String token) {
        try {
            Long memberId = JWT.require(algorithm)
                    .withClaim(TYPE_CLAIM, ACCESS_TYPE)
                    .build()
                    .verify(token)
                    .getClaim(MEMBER_ID_CLAIM)
                    .asLong();
            if (memberId == null) {
                throw new UnAuthorizationException(ErrorCode.UNAUTHORIZATION_TOKEN);
            }
            return memberId;
        } catch (JWTVerificationException e) {
            throw new UnAuthorizationException(ErrorCode.UNAUTHORIZATION_TOKEN);
        }
    }
}

package com.gachi.gacha.server.common.auth.jwt;

import static java.util.concurrent.TimeUnit.DAYS;
import static java.util.concurrent.TimeUnit.MILLISECONDS;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.UnAuthorizationException;
import java.util.Date;
import org.springframework.stereotype.Service;

@Service
public class JwtProvider {

    private final long accessTokenExpirationDayToMills;
    private final Algorithm algorithm;

    public JwtProvider(final JwtProperty jwtProperty) {
        this.accessTokenExpirationDayToMills = MILLISECONDS.convert(jwtProperty.accessTokenExpirationDay(), DAYS);
        this.algorithm = Algorithm.HMAC256(jwtProperty.secretKey());
    }

    public String createToken(final Long memberId) {
        return JWT.create()
                .withExpiresAt(new Date(
                        System.currentTimeMillis() + accessTokenExpirationDayToMills
                ))
                .withIssuedAt(new Date())
                .withClaim("memberId", memberId)
                .sign(algorithm);
    }

    public Object extractMemberId(final String token) {
        try{
            return JWT.require(algorithm)
                    .build()
                    .verify(token)
                    .getClaim("memberId")
                    .asLong();
        } catch (JWTVerificationException e) {
            throw new UnAuthorizationException(ErrorCode.UNAUTHORIZATION_TOKEN);
        }
    }
}

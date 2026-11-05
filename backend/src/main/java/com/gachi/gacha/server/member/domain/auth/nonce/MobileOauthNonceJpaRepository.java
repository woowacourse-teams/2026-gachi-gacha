package com.gachi.gacha.server.member.domain.auth.nonce;

import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MobileOauthNonceJpaRepository extends JpaRepository<MobileOauthNonce, Long> {

    @Modifying
    @Query("delete from MobileOauthNonce n where n.nonceHash = :nonceHash "
            + "and n.provider = :provider and n.expiresAt > :now")
    int consume(@Param("nonceHash") String nonceHash, @Param("provider") OauthProviderType provider,
                @Param("now") LocalDateTime now);

    @Modifying
    @Query("delete from MobileOauthNonce n where n.expiresAt <= :now")
    int deleteExpired(@Param("now") LocalDateTime now);
}

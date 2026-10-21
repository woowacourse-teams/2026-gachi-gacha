package com.gachi.gacha.server.notification.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface PushTokenJpaRepository extends JpaRepository<PushToken, Long> {

    Optional<PushToken> findByToken(String token);

    List<PushToken> findAllByMemberId(Long memberId);

    void deleteAllByMemberId(Long memberId);

    @Transactional
    @Modifying
    @Query("DELETE FROM PushToken pushToken WHERE pushToken.token IN :tokens")
    void deleteAllByTokenIn(Collection<String> tokens);
}

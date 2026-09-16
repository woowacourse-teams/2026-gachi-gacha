package com.gachi.gacha.server.member.domain;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.exception.MemberNotFoundException;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    default Member getMemberByOauthId(final OauthId oauthId) {
        return findByOauthId(oauthId).orElseThrow(() -> new MemberNotFoundException(ErrorCode.MEMBER_NOT_FOUND));
    }

    Optional<Member> findByOauthId(final OauthId oauthId);
}

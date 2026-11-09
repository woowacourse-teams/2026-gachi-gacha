package com.gachi.gacha.server.favorite.gacha.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.favorite.gacha.application.dto.FavoriteCountsInfo;
import com.gachi.gacha.server.favorite.gacha.application.event.GachaFavoriteChangedEvent;
import com.gachi.gacha.server.favorite.gacha.domain.GachaFavorite;
import com.gachi.gacha.server.favorite.gacha.domain.GachaFavoriteJpaRepository;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.server.gacha.domain.exception.GachaNotFoundException;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GachaFavoriteService {

    private final GachaFavoriteJpaRepository gachaFavoriteJpaRepository;
    private final GachaJpaRepository gachas;
    private final MemberJpaRepository members;
    private final ApplicationEventPublisher publisher;

    @Transactional
    public void add(final Long memberId, final Long gachaId) {
        if (gachaFavoriteJpaRepository.existsByMemberIdAndGachaId(memberId, gachaId)) {
            return;
        }
        Gacha gacha = gachas.findByIdWithCategories(gachaId)
                .orElseThrow(() -> new GachaNotFoundException(ErrorCode.GACHA_NOT_FOUND));
        Member member = members.getReferenceById(memberId);
        gachaFavoriteJpaRepository.save(GachaFavorite.of(member, gacha));
        publisher.publishEvent(new GachaFavoriteChangedEvent(memberId, gachaId, true));
    }

    @Transactional
    public void remove(final Long memberId, final Long gachaId) {
        gachaFavoriteJpaRepository.deleteByMemberIdAndGachaId(memberId, gachaId);
        publisher.publishEvent(new GachaFavoriteChangedEvent(memberId, gachaId, false));
    }

    @Transactional(readOnly = true)
    public FavoriteCountsInfo countsByMemberId(final Long memberId) {
        return FavoriteCountsInfo.from(gachaFavoriteJpaRepository.countByMemberId(memberId));
    }
}

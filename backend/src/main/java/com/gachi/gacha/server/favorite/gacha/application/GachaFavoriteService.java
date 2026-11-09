package com.gachi.gacha.server.favorite.gacha.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.favorite.gacha.application.dto.FavoriteCountsInfo;
import com.gachi.gacha.server.favorite.gacha.application.event.GachaFavoriteChangedEvent;
import com.gachi.gacha.server.favorite.gacha.domain.GachaFavorite;
import com.gachi.gacha.server.favorite.gacha.domain.GachaFavoriteJpaRepository;
import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.server.gacha.domain.exception.GachaNotFoundException;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GachaFavoriteService {

    private final GachaFavoriteJpaRepository gachaFavoriteJpaRepository;
    private final GachaJpaRepository gachaJpaRepository;
    private final MemberJpaRepository memberJpaRepository;
    private final ApplicationEventPublisher publisher;

    @Transactional
    public void add(final Long memberId, final Long gachaId) {
        if (gachaFavoriteJpaRepository.existsByMemberIdAndGachaId(memberId, gachaId)) {
            return;
        }
        Gacha gacha = gachaJpaRepository.findByIdWithCategories(gachaId)
                .orElseThrow(() -> new GachaNotFoundException(ErrorCode.GACHA_NOT_FOUND));
        Member member = memberJpaRepository.getReferenceById(memberId);
        gachaFavoriteJpaRepository.save(GachaFavorite.of(member, gacha));
        publisher.publishEvent(new GachaFavoriteChangedEvent(memberId, gachaId, true));
    }

    @Transactional
    public void remove(final Long memberId, final Long gachaId) {
        int deleted = gachaFavoriteJpaRepository.deleteByMemberIdAndGachaId(memberId, gachaId);
        if (deleted > 0) {
            publisher.publishEvent(new GachaFavoriteChangedEvent(memberId, gachaId, false));
        }
    }


    @Transactional(readOnly = true)
    public FavoriteCountsInfo countsByMemberId(final Long memberId) {
        List<GachaInfo> gachas = gachaFavoriteJpaRepository.findAllWithGachaByMemberId(memberId)
                .stream()
                .map(f -> GachaInfo.from(f.getGacha()))
                .toList();
        return FavoriteCountsInfo.of(gachas, gachas.size());
    }
}

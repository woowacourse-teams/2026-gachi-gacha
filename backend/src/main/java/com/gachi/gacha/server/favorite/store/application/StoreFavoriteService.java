package com.gachi.gacha.server.favorite.store.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.favorite.store.domain.StoreFavorite;
import com.gachi.gacha.server.favorite.store.domain.StoreFavoriteJpaRepository;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreJpaRepository;
import com.gachi.gacha.server.store.domain.exception.StoreNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreFavoriteService {

    private final StoreFavoriteJpaRepository favorites;
    private final StoreJpaRepository stores;
    private final MemberJpaRepository members;
    private final ApplicationEventPublisher publisher;

    @Transactional
    public void add(final Long memberId, final Long storeId) {
        if (favorites.existsByMemberIdAndStoreId(memberId, storeId)) {
            return;
        }
        Store store = stores.findById(storeId)
                .orElseThrow(() -> new StoreNotFoundException(ErrorCode.STORE_NOT_FOUND));
        Member member = members.getReferenceById(memberId);
        favorites.save(StoreFavorite.of(member, store));
        publisher.publishEvent(new StoreFavoriteChangedEvent(memberId, storeId, true));
    }

    @Transactional
    public void remove(final Long memberId, final Long storeId) {
        favorites.deleteByMemberIdAndStoreId(memberId, storeId);
        publisher.publishEvent(new StoreFavoriteChangedEvent(memberId, storeId, false));
    }
}

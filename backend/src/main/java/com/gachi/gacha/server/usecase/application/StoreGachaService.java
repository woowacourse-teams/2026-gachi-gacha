package com.gachi.gacha.server.usecase.application;

import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.usecase.application.dto.GachaSummaryInfo;
import com.gachi.gacha.server.usecase.domain.StoreGachaJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class StoreGachaService {

    private final StoreGachaJpaRepository storeGachaJpaRepository;

    public Page<GachaSummaryInfo> findGachasByStoreId(final Long storeId, final Pageable pageable) {
        Page<Gacha> gachas = storeGachaJpaRepository.findGachasByStoreId(storeId, pageable);
        return gachas.map(GachaSummaryInfo::from);
    }
}

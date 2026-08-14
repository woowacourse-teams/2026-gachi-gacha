package com.gachi.gacha.server.usecase.application;

import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.store.application.dto.StoreGachaInfo;
import com.gachi.gacha.server.usecase.application.dto.GachaSummaryInfo;
import com.gachi.gacha.server.usecase.application.dto.StoreGachaCreatCommand;
import com.gachi.gacha.server.usecase.application.dto.StoreGachaDeleteCommand;
import com.gachi.gacha.server.usecase.domain.StoreGacha;
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

    @Transactional
    public StoreGachaInfo addStoreGacha(final StoreGachaCreatCommand command) {
        StoreGacha storeGacha = StoreGacha.builder()
                .store(command.store())
                .gacha(command.gacha())
                .build();
        return StoreGachaInfo.from(storeGachaJpaRepository.save(storeGacha));
    }

    public Page<GachaSummaryInfo> findGachasByStoreId(final Long storeId, final Pageable pageable) {
        Page<Gacha> gachas = storeGachaJpaRepository.findGachasByStoreId(storeId, pageable);
        return gachas.map(GachaSummaryInfo::from);
    }

    @Transactional
    public StoreGachaInfo removeStoreGacha(final StoreGachaDeleteCommand storeGachaDeleteCommand) {
        return StoreGachaInfo.from(
                storeGachaJpaRepository.deleteStoreGachaByStoreAndGacha(
                        storeGachaDeleteCommand.store(), storeGachaDeleteCommand.gacha()
                )
        );
    }
}

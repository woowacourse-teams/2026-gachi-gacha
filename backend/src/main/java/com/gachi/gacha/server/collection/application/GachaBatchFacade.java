package com.gachi.gacha.server.collection.application;

import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.store.application.StoreService;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreDetail;
import com.gachi.gacha.server.usecase.application.StoreGachaService;
import com.gachi.gacha.server.usecase.application.dto.StoreGachaCreatCommand;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GachaBatchFacade {

    private final StoreService storeService;
    private final GachaBatchService gachaBatchService;
    private final StoreGachaService storeGachaService;

    public int collectAllGachas() {
        List<StoreDetail> targetStores = storeService.findAllStoresWithInstagram();
        log.info("인스타그램 데이터 수집 시작 (대상 상점 수: {}개)", targetStores.size());

        int collectedCount = 0;
        for (StoreDetail storeDetail : targetStores) {
            log.info("상점 크롤링 실행: {} ({})", storeDetail.getName(), storeDetail.getInstagramId());

            try {
                Store store = storeDetail.getStore();
                List<Gacha> collectedGachas = gachaBatchService.collectPostsForShop(storeDetail.getInstagramId());

                for (Gacha gacha : collectedGachas) {
                    StoreGachaCreatCommand command = StoreGachaCreatCommand.builder()
                            .store(store)
                            .gacha(gacha)
                            .build();
                    storeGachaService.addStoreGacha(command);
                }
                collectedCount += collectedGachas.size();
            } catch (Exception e) {
                log.error("상점 처리 실패: {} ({}) - {}", storeDetail.getName(), storeDetail.getInstagramId(),
                        e.getMessage());
            }
        }
        log.info("인스타그램 데이터 수집 완료 (신규 수집: {}건)", collectedCount);
        return collectedCount;
    }
}

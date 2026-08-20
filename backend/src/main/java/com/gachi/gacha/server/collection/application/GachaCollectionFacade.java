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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GachaCollectionFacade {
    private static final int PAGE_SIZE = 50;

    private final StoreService storeService;
    private final GachaCollectionService gachaCollectionService;
    private final StoreGachaService storeGachaService;

    public int collectAllGachas() {
        int collectedCount = 0;
        Pageable pageable = PageRequest.of(0, PAGE_SIZE, Sort.by("id"));
        Slice<StoreDetail> page;

        do {
            page = storeService.findStoresWithInstagram(pageable);
            for (StoreDetail storeDetail : page.getContent()) {
                log.info("상점 크롤링 실행: {} ({})", storeDetail.getName(), storeDetail.getInstagramId());

                try {
                    Store store = storeDetail.getStore();
                    List<Gacha> collectedGachas = gachaCollectionService.collectPostsForShop(
                            storeDetail.getInstagramId());

                    addStoreGachas(collectedGachas, store);
                    collectedCount += collectedGachas.size();
                } catch (Exception e) {
                    log.error("상점 처리 실패: {} ({}) - {}", storeDetail.getName(), storeDetail.getInstagramId(),
                            e.getMessage());
                }

            }
        } while (page.hasNext());

        log.info("인스타그램 가챠 데이터 수집 완료 (신규 수집: {}건)", collectedCount);
        return collectedCount;
    }

    private void addStoreGachas(List<Gacha> collectedGachas, Store store) {
        for (Gacha gacha : collectedGachas) {
            StoreGachaCreatCommand command = StoreGachaCreatCommand.builder()
                    .store(store)
                    .gacha(gacha)
                    .build();
            storeGachaService.addStoreGacha(command);
        }
    }
}

package com.gachi.gacha.server.collection.application;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.store.application.StoreService;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreDetail;
import com.gachi.gacha.server.usecase.application.StoreGachaService;
import com.gachi.gacha.server.usecase.application.dto.StoreGachaCreatCommand;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.SliceImpl;

@ExtendWith(MockitoExtension.class)
class GachaCollectionFacadeTest {

    @Mock
    private StoreService storeService;

    @Mock
    private GachaCollectionService gachaCollectionService;

    @Mock
    private StoreGachaService storeGachaService;

    private GachaCollectionFacade facade() {
        return new GachaCollectionFacade(storeService, gachaCollectionService, storeGachaService);
    }

    @Test
    @DisplayName("인스타그램이 연동된 모든 상점에 대해 수집한 가챠를 상점-가챠 매핑으로 저장한다.")
    void collectAllGachas_mapsCollectedGachasToEachStore() {
        // given
        StoreDetail store1 = storeDetail(1L, "shop1");
        StoreDetail store2 = storeDetail(2L, "shop2");
        when(storeService.findStoresWithInstagram(any())).thenReturn(new SliceImpl<>(List.of(store1, store2)));

        Gacha gacha1 = mock(Gacha.class);
        Gacha gacha2 = mock(Gacha.class);
        when(gachaCollectionService.collectPostsForShop("shop1")).thenReturn(List.of(gacha1));
        when(gachaCollectionService.collectPostsForShop("shop2")).thenReturn(List.of(gacha2));

        // when
        facade().collectAllGachas();

        // then
        verify(storeGachaService).addStoreGacha(
                eq(StoreGachaCreatCommand.builder().store(store1.getStore()).gacha(gacha1).build()));
        verify(storeGachaService).addStoreGacha(
                eq(StoreGachaCreatCommand.builder().store(store2.getStore()).gacha(gacha2).build()));
    }

    @Test
    @DisplayName("한 상점의 가챠 크롤링이 실패해도 다른 상점의 수집은 계속 진행된다.")
    void collectAllGachas_onePlatformCollectionFails_continuesWithOtherStores() {
        // given
        StoreDetail store1 = storeDetail(1L, "shop1");
        StoreDetail store2 = storeDetail(2L, "shop2");
        when(storeService.findStoresWithInstagram(any())).thenReturn(new SliceImpl<>(List.of(store1, store2)));

        when(gachaCollectionService.collectPostsForShop("shop1")).thenThrow(new RuntimeException("크롤링 실패"));
        Gacha gacha2 = mock(Gacha.class);
        when(gachaCollectionService.collectPostsForShop("shop2")).thenReturn(List.of(gacha2));

        // when & then
        assertThatCode(() -> facade().collectAllGachas()).doesNotThrowAnyException();
        verify(storeGachaService, times(1)).addStoreGacha(
                eq(StoreGachaCreatCommand.builder().store(store2.getStore()).gacha(gacha2).build()));
    }

    @Test
    @DisplayName("한 상점의 상점-가챠 매핑 저장이 실패해도 다른 상점의 처리는 계속 진행된다.")
    void collectAllGachas_oneStoreGachaMappingFails_continuesWithOtherStores() {
        // given
        StoreDetail store1 = storeDetail(1L, "shop1");
        StoreDetail store2 = storeDetail(2L, "shop2");
        when(storeService.findStoresWithInstagram(any())).thenReturn(new SliceImpl<>(List.of(store1, store2)));

        Gacha gacha1 = mock(Gacha.class);
        Gacha gacha2 = mock(Gacha.class);
        when(gachaCollectionService.collectPostsForShop("shop1")).thenReturn(List.of(gacha1));
        when(gachaCollectionService.collectPostsForShop("shop2")).thenReturn(List.of(gacha2));

        StoreGachaCreatCommand store1Command = StoreGachaCreatCommand.builder()
                .store(store1.getStore()).gacha(gacha1).build();
        StoreGachaCreatCommand store2Command = StoreGachaCreatCommand.builder()
                .store(store2.getStore()).gacha(gacha2).build();
        when(storeGachaService.addStoreGacha(eq(store1Command))).thenThrow(new RuntimeException("매핑 저장 실패"));

        // when & then
        assertThatCode(() -> facade().collectAllGachas()).doesNotThrowAnyException();
        verify(storeGachaService).addStoreGacha(eq(store2Command));
    }

    @Test
    @DisplayName("인스타그램이 연동된 상점이 없으면 아무 것도 수집하지 않는다.")
    void collectAllGachas_noStoresWithInstagram_doesNothing() {
        // given
        when(storeService.findStoresWithInstagram(any())).thenReturn(new SliceImpl<>(List.of()));

        // when
        facade().collectAllGachas();

        // then
        verify(gachaCollectionService, never()).collectPostsForShop(any());
        verify(storeGachaService, never()).addStoreGacha(any());
    }

    private StoreDetail storeDetail(final Long storeId, final String instagramId) {
        Store store = Store.builder()
                .id(storeId)
                .latitude(37.5)
                .longitude(127.0)
                .build();
        return StoreDetail.builder()
                .id(storeId)
                .store(store)
                .name("상점" + storeId)
                .address("주소" + storeId)
                .instagramId(instagramId)
                .build();
    }
}

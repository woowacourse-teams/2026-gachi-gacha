package com.gachi.gacha.server.favorite.signal.application.event;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.times;

import com.gachi.gacha.server.favorite.gacha.application.event.GachaFavoriteChangedEvent;
import com.gachi.gacha.server.favorite.signal.application.FavoriteSignalService;
import com.gachi.gacha.server.favorite.store.application.event.StoreFavoriteChangedEvent;
import com.gachi.gacha.server.favorite.trade.application.event.TradeFavoriteChangedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FavoriteSignalEventListenerTest {

    private static final Long MEMBER_ID = 1L;
    private static final Long TARGET_ID = 10L;

    @Mock
    private FavoriteSignalService favoriteSignalService;

    private FavoriteSignalEventListener listener;

    @BeforeEach
    void setUp() {
        listener = new FavoriteSignalEventListener(favoriteSignalService);
    }

    @Test
    @DisplayName("게시글 찜 해제 이벤트도 최신 찜 상태를 기준으로 신호를 동기화한다")
    void tradeFavoriteRemoved_rebuildsFromCurrentFavoriteState() {
        listener.handleTradeFavoriteChangedEvent(new TradeFavoriteChangedEvent(MEMBER_ID, TARGET_ID, false));

        verify(favoriteSignalService).rebuildForTradeFavorite(MEMBER_ID, TARGET_ID);
        verifyNoMoreInteractions(favoriteSignalService);
    }

    @Test
    @DisplayName("재등록 이벤트보다 이전 해제 이벤트가 늦게 와도 매번 최신 상태 동기화를 요청한다")
    void tradeFavoriteEventsOutOfOrder_alwaysRebuild() {
        listener.handleTradeFavoriteChangedEvent(new TradeFavoriteChangedEvent(MEMBER_ID, TARGET_ID, true));
        listener.handleTradeFavoriteChangedEvent(new TradeFavoriteChangedEvent(MEMBER_ID, TARGET_ID, true));
        listener.handleTradeFavoriteChangedEvent(new TradeFavoriteChangedEvent(MEMBER_ID, TARGET_ID, false));

        verify(favoriteSignalService, times(3)).rebuildForTradeFavorite(MEMBER_ID, TARGET_ID);
        verifyNoMoreInteractions(favoriteSignalService);
    }

    @Test
    @DisplayName("가챠 찜 해제 이벤트도 최신 찜 상태를 기준으로 신호를 동기화한다")
    void gachaFavoriteRemoved_rebuildsFromCurrentFavoriteState() {
        listener.handleGachaFavoriteChangedEvent(new GachaFavoriteChangedEvent(MEMBER_ID, TARGET_ID, false));

        verify(favoriteSignalService).rebuildForGachaFavorite(MEMBER_ID, TARGET_ID);
        verifyNoMoreInteractions(favoriteSignalService);
    }

    @Test
    @DisplayName("매장 찜 해제 이벤트도 최신 찜 상태를 기준으로 신호를 동기화한다")
    void storeFavoriteRemoved_rebuildsFromCurrentFavoriteState() {
        listener.handleStoreFavoriteChangedEvent(new StoreFavoriteChangedEvent(MEMBER_ID, TARGET_ID, false));

        verify(favoriteSignalService).rebuildForStoreFavorite(MEMBER_ID, TARGET_ID);
        verifyNoMoreInteractions(favoriteSignalService);
    }
}

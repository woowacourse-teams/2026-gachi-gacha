package com.gachi.gacha.server.favorite.gacha.application;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
class GachaFavoriteFacadeTest {

    @Mock
    private GachaFavoriteService favoriteService;

    @InjectMocks
    private GachaFavoriteFacade favoriteFacade;

    @Test
    void add_동시_중복등록은_이미_처리된_요청으로_다룬다() {
        doThrow(new DataIntegrityViolationException("duplicate"))
                .when(favoriteService).add(1L, 10L);
        given(favoriteService.isFavorite(1L, 10L)).willReturn(true);

        assertThatCode(() -> favoriteFacade.add(1L, 10L)).doesNotThrowAnyException();
    }

    @Test
    void add_중복이_아닌_무결성_오류는_그대로_던진다() {
        DataIntegrityViolationException exception = new DataIntegrityViolationException("other constraint");
        doThrow(exception).when(favoriteService).add(1L, 10L);
        given(favoriteService.isFavorite(1L, 10L)).willReturn(false);

        assertThatThrownBy(() -> favoriteFacade.add(1L, 10L)).isSameAs(exception);
        verify(favoriteService).isFavorite(1L, 10L);
    }
}

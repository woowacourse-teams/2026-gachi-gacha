package com.gachi.gacha.server.usecase.application;

import com.gachi.gacha.server.usecase.domain.StoreGachaCount;
import com.gachi.gacha.server.usecase.domain.StoreGachaJpaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class StoreGachaServiceTest {

    @Mock
    private StoreGachaJpaRepository storeGachaJpaRepository;

    @InjectMocks
    private StoreGachaService storeGachaService; // 테스트 대상 서비스 (클래스명이 다르다면 맞게 수정해 주세요)

    @Test
    @DisplayName("가챠 ID 목록으로 매장 개수 조회 서비스 로직 검증")
    void findStoreGachaCountByGachaIds() {
        // given
        List<Long> gachaIds = List.of(1L, 2L);
        List<StoreGachaCount> expectedCounts = List.of(
                new StoreGachaCount(1L, 3L),
                new StoreGachaCount(2L, 5L)
        );

        given(storeGachaJpaRepository.countByGachaIds(gachaIds)).willReturn(expectedCounts);

        // when
        List<StoreGachaCount> result = storeGachaService.findSoreGachaCountByGachaIds(gachaIds);

        // then
        assertThat(result).hasSize(2);
        assertThat(result).isEqualTo(expectedCounts);
        verify(storeGachaJpaRepository).countByGachaIds(gachaIds);
    }
}

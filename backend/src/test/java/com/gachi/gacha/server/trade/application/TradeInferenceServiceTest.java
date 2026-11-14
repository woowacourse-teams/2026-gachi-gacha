package com.gachi.gacha.server.trade.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.server.gacha.application.dto.InferenceGacha;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeInference;
import com.gachi.gacha.server.trade.domain.TradeInferenceJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.application.event.TradeInferenceCompletedEvent;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

@ExtendWith(MockitoExtension.class)
class TradeInferenceServiceTest {

    @Mock
    private GachaJpaRepository gachaJpaRepository;

    @Mock
    private TradeJpaRepository tradeJpaRepository;

    @Mock
    private TradeInferenceJpaRepository tradeInferenceJpaRepository;

    @Mock
    private ApplicationEventPublisher publisher;

    @InjectMocks
    private TradeInferenceService tradeInferenceService;

    @Test
    @DisplayName("ES에만 있는 가챠 ID는 연결하지 않고 카테고리와 키워드는 추론 결과에 저장한다")
    void save_esGachaMissingFromDatabase() {
        Long tradeId = 10L;
        LocalDateTime inferredAt = LocalDateTime.now();
        given(gachaJpaRepository.findById(36638L)).willReturn(Optional.empty());
        given(tradeInferenceJpaRepository.findById(tradeId)).willReturn(Optional.empty());

        tradeInferenceService.save(
                tradeId,
                inferredAt,
                Set.of("치이카와"),
                InferenceGacha.builder()
                        .gachaId(36638L)
                        .score(12.5)
                        .categoryIds(Set.of(5621L))
                        .build()
        );

        ArgumentCaptor<TradeInference> inferenceCaptor = ArgumentCaptor.forClass(TradeInference.class);
        verify(tradeInferenceJpaRepository).save(inferenceCaptor.capture());
        TradeInference saved = inferenceCaptor.getValue();
        assertThat(saved.getInferredGacha()).isNull();
        assertThat(saved.getScore()).isEqualTo(12.5);
        assertThat(saved.getInferredCategoryIds()).containsExactly(5621L);
        assertThat(saved.getInferredKeywords()).containsExactly("치이카와");
        verify(publisher).publishEvent(any(TradeInferenceCompletedEvent.class));
    }
}

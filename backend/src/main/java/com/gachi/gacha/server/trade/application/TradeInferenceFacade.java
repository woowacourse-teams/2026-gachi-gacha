package com.gachi.gacha.server.trade.application;

import com.gachi.gacha.server.gacha.application.GachaSearchService;
import com.gachi.gacha.server.gacha.application.dto.GachaSearchCondition;
import com.gachi.gacha.server.gacha.application.dto.InferenceGacha;
import com.gachi.gacha.server.trade.application.dto.TradeInferenceSource;
import java.io.IOException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 트랜잭션을 걸지 않는다. ES 호출 동안 DB 커넥션을 잡고 있지 않도록
 * TradeInferenceService 의 짧은 트랜잭션 두 개(읽기, 저장) 사이에서 ES 검색을 수행한다.
 * 서비스는 다른 빈이라 프록시를 거치므로 각 호출마다 트랜잭션이 정상 적용된다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TradeInferenceFacade {

    private final TradeInferenceService tradeInferenceService;
    private final GachaSearchService gachaSearchService;

    /**
     * 추론할 가챠가 없어도 빈 결과를 저장한다. 행이 없으면 아직 추론되지 않은 글로 보고 계속 재시도하기 때문이다.
     */
    public void infer(final Long tradeId) throws IOException {
        Optional<TradeInferenceSource> found = tradeInferenceService.findSource(tradeId);
        if (found.isEmpty()) {
            return;   // 그 사이 삭제된 글
        }
        TradeInferenceSource source = found.get();

        InferenceGacha inferred = gachaSearchService.infer(GachaSearchCondition.toCondition(source)).orElse(null);

        tradeInferenceService.save(tradeId, source.readAt(), inferred);
        log.info("trade 추론 완료 tradeId={} keyword={} gachaId={} score={}",
                tradeId,
                source.keyword(),
                inferred != null ? inferred.gachaId() : null,
                inferred != null ? inferred.score() : null);
    }
}

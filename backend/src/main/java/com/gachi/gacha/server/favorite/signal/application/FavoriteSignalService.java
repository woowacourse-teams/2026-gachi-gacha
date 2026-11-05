package com.gachi.gacha.server.favorite.signal.application;

import com.gachi.gacha.server.favorite.signal.domain.FavoriteSignal;
import com.gachi.gacha.server.favorite.signal.domain.FavoriteSignalJpaRepository;
import com.gachi.gacha.server.favorite.signal.domain.FavoriteType;
import com.gachi.gacha.server.favorite.signal.domain.SignalType;
import com.gachi.gacha.server.favorite.gacha.domain.GachaFavorite;
import com.gachi.gacha.server.favorite.gacha.domain.GachaFavoriteJpaRepository;
import com.gachi.gacha.server.favorite.store.domain.StoreFavorite;
import com.gachi.gacha.server.favorite.store.domain.StoreFavoriteJpaRepository;
import com.gachi.gacha.server.favorite.trade.domain.TradeFavorite;
import com.gachi.gacha.server.favorite.trade.domain.TradeFavoriteJpaRepository;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeInference;
import com.gachi.gacha.server.trade.domain.TradeInferenceJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.server.store.domain.Store;
import com.gachi.gacha.server.store.domain.StoreJpaRepository;
import com.gachi.gacha.server.usecase.domain.StoreGachaJpaRepository;
import com.gachi.gacha.server.trade.util.TradeKeywordCleaner;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 영수증(favorite_signal)을 만들고 지운다. 항상 "그 대상의 신호를 지우고 다시 넣는" 방식이라
 * 같은 이벤트가 몇 번 처리돼도 결과가 같다(멱등).
 *
 * 이벤트 리스너(AFTER_COMMIT)에서 호출되므로 REQUIRES_NEW 가 필요하다.
 * 기존 트랜잭션은 이미 끝났기 때문에 REQUIRED 로 두면 변경이 커밋되지 않는다.
 */
@Service
@RequiredArgsConstructor
public class FavoriteSignalService {

    private final FavoriteSignalJpaRepository favoriteSignalJpaRepository;
    private final TradeFavoriteJpaRepository tradeFavoriteJpaRepository;
    private final TradeJpaRepository tradeJpaRepository;
    private final TradeInferenceJpaRepository tradeInferenceJpaRepository;
    private final GachaFavoriteJpaRepository gachaFavoriteJpaRepository;
    private final StoreFavoriteJpaRepository storeFavoriteJpaRepository;
    private final GachaJpaRepository gachaJpaRepository;
    private final StoreJpaRepository storeJpaRepository;
    private final StoreGachaJpaRepository storeGachaJpaRepository;

    // 드라이런 동안은 0.0(전부 수용)으로 두고 데이터를 본다. 알림을 켜기 전에 로그를 보고 올린다.
    @Value("${favorite.signal.inference-accept-score:0.0}")
    private double inferenceAcceptScore;

    @Value("${favorite.signal.category-weight:0.6}")
    private double categoryWeight;

    @Value("${favorite.signal.keyword-weight:0.4}")
    private double keywordWeight;

    /** 찜 등록 직후: 이 사용자의 이 글에 대한 신호를 만든다. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void rebuildForTradeFavorite(final Long memberId, final Long tradeId) {
        List<TradeFavorite> favorites = tradeFavoriteJpaRepository.findByMemberIdAndTradeId(memberId, tradeId)
                .stream()
                .toList();
        replaceTradeSignals(tradeId, List.of(memberId), favorites);
    }

    /** 찜 해제 직후: 그 찜에서 나온 신호만 지운다. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void removeForTradeFavorite(final Long memberId, final Long tradeId) {
        favoriteSignalJpaRepository.deleteByMemberAndTarget(memberId, FavoriteType.TRADE, tradeId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void rebuildForGachaFavorite(final Long memberId, final Long gachaId) {
        GachaFavorite favorite = gachaFavoriteJpaRepository.findByMemberIdAndGachaId(memberId, gachaId).orElse(null);
        favoriteSignalJpaRepository.deleteByMemberAndTarget(memberId, FavoriteType.GACHA, gachaId);
        if (favorite == null) {
            return;
        }
        Gacha gacha = gachaJpaRepository.findByIdWithCategories(gachaId).orElse(null);
        if (gacha == null) {
            return;
        }
        Set<Long> categories = gacha.getGachaCategories().stream()
                .map(gc -> gc.getCategory().getId()).collect(Collectors.toSet());
        List<String> keywords = TradeKeywordCleaner.extractKeywords(gacha.getName()).stream().sorted().toList();
        List<TradeSignalExtractor.SignalItem> items = TradeSignalExtractor.extract(
                categories, Set.of(), null, inferenceAcceptScore, keywords, 0.3, 0.3);
        List<FavoriteSignal> signals = new java.util.ArrayList<>();
        signals.add(FavoriteSignal.of(memberId, FavoriteType.GACHA, gachaId,
                SignalType.GACHA, String.valueOf(gachaId), 0.4, favorite.getCreatedAt()));
        items.forEach(item -> signals.add(FavoriteSignal.of(memberId, FavoriteType.GACHA, gachaId,
                item.type(), item.value(), item.weight(), favorite.getCreatedAt())));
        favoriteSignalJpaRepository.saveAll(signals);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void rebuildForStoreFavorite(final Long memberId, final Long storeId) {
        StoreFavorite favorite = storeFavoriteJpaRepository.findByMemberIdAndStoreId(memberId, storeId).orElse(null);
        favoriteSignalJpaRepository.deleteByMemberAndTarget(memberId, FavoriteType.STORE, storeId);
        if (favorite == null) {
            return;
        }
        Store store = storeJpaRepository.findById(storeId).orElse(null);
        if (store == null) {
            return;
        }
        List<Gacha> gachas = storeGachaJpaRepository.findGachasWithCategoriesByStoreId(storeId);
        Set<Long> categories = gachas.stream().flatMap(gacha -> gacha.getGachaCategories().stream())
                .map(gc -> gc.getCategory().getId()).collect(Collectors.toSet());
        Set<String> keywords = gachas.stream().map(Gacha::getName)
                .flatMap(name -> TradeKeywordCleaner.extractKeywords(name).stream())
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
        List<TradeSignalExtractor.SignalItem> items = TradeSignalExtractor.extract(
                categories, Set.of(), null, inferenceAcceptScore, keywords, 0.45, 0.45);
        List<FavoriteSignal> signals = new java.util.ArrayList<>();
        signals.add(FavoriteSignal.of(memberId, FavoriteType.STORE, storeId,
                SignalType.STORE, String.valueOf(storeId), 0.1, favorite.getCreatedAt()));
        String area = store.getAddress().split("\\s+").length >= 2
                ? String.join(" ", java.util.Arrays.copyOf(store.getAddress().split("\\s+"), 2))
                : store.getAddress();
        signals.add(FavoriteSignal.of(memberId, FavoriteType.STORE, storeId,
                SignalType.AREA, area, 0.1, favorite.getCreatedAt()));
        items.forEach(item -> signals.add(FavoriteSignal.of(memberId, FavoriteType.STORE, storeId,
                item.type(), item.value(), item.weight(), favorite.getCreatedAt())));
        favoriteSignalJpaRepository.saveAll(signals);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void removeSignalsForTarget(final Long memberId, final FavoriteType favoriteType, final Long targetId) {
        favoriteSignalJpaRepository.deleteByMemberAndTarget(memberId, favoriteType, targetId);
    }

    /** 추론 완료 직후: 그 글을 찜한 모든 사용자의 신호를 다시 만든다. 처리한 사용자 수를 반환한다. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int rebuildForTrade(final Long tradeId) {
        List<TradeFavorite> favorites = tradeFavoriteJpaRepository.findByTradeId(tradeId);
        if (favorites.isEmpty()) {
            return 0;
        }
        List<Long> memberIds = favorites.stream()
                .map(favorite -> favorite.getMember().getId())
                .toList();
        replaceTradeSignals(tradeId, memberIds, favorites);
        return favorites.size();
    }

    private void replaceTradeSignals(
            final Long tradeId,
            final List<Long> memberIds,
            final List<TradeFavorite> favorites
    ) {
        favoriteSignalJpaRepository.deleteByTarget(FavoriteType.TRADE, tradeId, memberIds);

        Trade trade = tradeJpaRepository.findById(tradeId).orElse(null);
        if (trade == null || favorites.isEmpty()) {
            return;
        }
        Set<Long> userCategoryIds = trade.getTradeCategories().stream()
                .map(tradeCategory -> tradeCategory.getCategory().getId())
                .collect(Collectors.toSet());
        TradeInference inference = tradeInferenceJpaRepository.findById(tradeId).orElse(null);
        List<String> keywords = (inference == null) ? List.of() : inference.getInferredKeywords().stream().sorted().toList();
        List<TradeSignalExtractor.SignalItem> items = TradeSignalExtractor.extract(
                userCategoryIds,
                inference != null ? inference.getInferredCategoryIds() : Set.of(),
                inference != null ? inference.getScore() : null,
                inferenceAcceptScore,
                keywords,
                categoryWeight,
                keywordWeight
        );
        List<FavoriteSignal> signals = favorites.stream()
                .flatMap(favorite -> items.stream()
                        .map(item -> FavoriteSignal.of(
                                favorite.getMember().getId(),
                                FavoriteType.TRADE,
                                tradeId,
                                item.type(),
                                item.value(),
                                item.weight(),
                                favorite.getCreatedAt()   // 찜한 시각 그대로. 재생성해도 "지금"으로 바꾸지 않는다.
                        )))
                .toList();
        favoriteSignalJpaRepository.saveAll(signals);
    }
}

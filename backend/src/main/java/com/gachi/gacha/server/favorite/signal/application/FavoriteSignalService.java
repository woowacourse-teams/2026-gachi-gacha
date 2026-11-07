package com.gachi.gacha.server.favorite.signal.application;

import com.gachi.gacha.server.favorite.signal.domain.SignalExtractor;
import com.gachi.gacha.server.favorite.signal.domain.FavoriteSignal;
import com.gachi.gacha.server.favorite.signal.domain.FavoriteSignalJpaRepository;
import com.gachi.gacha.server.favorite.signal.domain.FavoriteType;
import com.gachi.gacha.server.favorite.signal.domain.SignalItem;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteSignalService {

    private static final double GACHA_SELF_WEIGHT = 0.4;
    private static final double GACHA_CATEGORY_WEIGHT = 0.3;
    private static final double GACHA_KEYWORD_WEIGHT = 0.3;

    private static final double STORE_SELF_WEIGHT = 0.1;
    private static final double STORE_AREA_WEIGHT = 0.1;
    private static final double STORE_CATEGORY_WEIGHT = 0.45;
    private static final double STORE_KEYWORD_WEIGHT = 0.45;
    
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
        List<String> keywords = TradeKeywordCleaner.extractKeywords(gacha.getName()).stream()
                .sorted()
                .toList();

        List<SignalItem> items = new ArrayList<>();
        items.add(new SignalItem(SignalType.GACHA, String.valueOf(gachaId), GACHA_SELF_WEIGHT));
        items.addAll(SignalExtractor.extract(categoryIdsOf(gacha), Set.of(), null, inferenceAcceptScore, keywords, GACHA_CATEGORY_WEIGHT, GACHA_KEYWORD_WEIGHT));
        saveSignals(memberId, FavoriteType.GACHA, gachaId, items, favorite.getCreatedAt());
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
        Set<Long> categories = gachas.stream()
                .flatMap(gacha -> categoryIdsOf(gacha).stream())
                .collect(Collectors.toSet());
        Set<String> keywords = gachas.stream().map(Gacha::getName)
                .flatMap(name -> TradeKeywordCleaner.extractKeywords(name).stream())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<SignalItem> items = new ArrayList<>();
        items.add(new SignalItem(SignalType.STORE, String.valueOf(storeId), STORE_SELF_WEIGHT));
        items.add(new SignalItem(SignalType.AREA, extractArea(store.getAddress()), STORE_AREA_WEIGHT));
        items.addAll(SignalExtractor.extract(categories, Set.of(), null, inferenceAcceptScore,
                keywords, STORE_CATEGORY_WEIGHT, STORE_KEYWORD_WEIGHT));

        saveSignals(memberId, FavoriteType.STORE, storeId, items, favorite.getCreatedAt());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void removeSignalsForTarget(final Long memberId, final FavoriteType favoriteType, final Long targetId) {
        favoriteSignalJpaRepository.deleteByMemberAndTarget(memberId, favoriteType, targetId);
    }

    /** 추론 완료 직후: 그 글을 찜한 모든 사용자의 신호를 다시 만든다. 처리한 사용자 수를 반환한다. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void rebuildForTrade(final Long tradeId) {
        List<TradeFavorite> favorites = tradeFavoriteJpaRepository.findByTradeId(tradeId);
        if (favorites.isEmpty()) {
            return;
        }
        List<Long> memberIds = favorites.stream()
                .map(favorite -> favorite.getMember().getId())
                .toList();
        replaceTradeSignals(tradeId, memberIds, favorites);
        log.info("{} favorite(s) rebuild for {}", favorites.size(), tradeId);
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
        TradeInference inference = tradeInferenceJpaRepository.findById(tradeId).orElse(null);
        List<String> keywords = (inference == null) ? List.of() : inference.getInferredKeywords().stream()
                .sorted().toList();
        List<SignalItem> items = SignalExtractor.extract(
                categoryIdsOf(trade),
                (inference != null) ? inference.getInferredCategoryIds() : Set.of(),
                (inference != null) ? inference.getScore() : null,
                inferenceAcceptScore,
                keywords,
                categoryWeight,
                keywordWeight
        );
        List<FavoriteSignal> signals = favorites.stream()
                .flatMap(favorite -> toSignals(favorite.getMember().getId(), FavoriteType.TRADE,
                        tradeId, items, favorite.getCreatedAt()).stream()).toList();
        favoriteSignalJpaRepository.saveAll(signals);
    }

    private Set<Long> categoryIdsOf(final Trade trade) {
        return trade.getTradeCategories().stream()
                .map(tradeCategory -> tradeCategory.getCategory().getId())
                .collect(Collectors.toSet());
    }

    private Set<Long> categoryIdsOf(final Gacha gacha) {
        return gacha.getGachaCategories().stream()
                .map(gachaCategory -> gachaCategory.getCategory().getId())
                .collect(Collectors.toSet());
    }

    private void saveSignals(
            final Long memberId,
            final FavoriteType favoriteType,
            final Long targetId,
            final List<SignalItem> items,
            final LocalDateTime favoriteAt
    ) {
        favoriteSignalJpaRepository.saveAll(toSignals(memberId, favoriteType, targetId, items, favoriteAt));
    }

    private List<FavoriteSignal> toSignals(
            final Long memberId,
            final FavoriteType favoriteType,
            final Long targetId,
            final List<SignalItem> items,
            final LocalDateTime favoriteAt
    ) {
        return items.stream()
                .map(item -> toSignal(memberId, favoriteType, targetId, item, favoriteAt))
                .toList();
    }

    private FavoriteSignal toSignal(
            final Long memberId,
            final FavoriteType favoriteType,
            final Long targetId,
            final SignalItem item,
            final LocalDateTime favoriteAt
    ) {
        return FavoriteSignal.of(memberId, favoriteType, targetId,
                item.type(), item.value(), item.weight(), favoriteAt);
    }

    private String extractArea(final String address) {
        String[] tokens = address.split("\\s+");
        return tokens.length >= 2 ? tokens[0] + " " + tokens[1] : address;
    }
}

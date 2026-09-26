package com.gachi.gacha.server.trade.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.infra.application.MultipartUploader;
import com.gachi.gacha.server.common.infra.domain.DomainType;
import com.gachi.gacha.server.common.util.S3TransactionManager;
import com.gachi.gacha.server.gacha.domain.Category;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.trade.application.dto.TradeCreateCommand;
import com.gachi.gacha.server.trade.application.dto.TradeInfo;
import com.gachi.gacha.server.trade.application.dto.TradeSearchCondition;
import com.gachi.gacha.server.trade.application.dto.TradeSummaryInfo;
import com.gachi.gacha.server.trade.application.dto.TradeUpdateCommand;
import com.gachi.gacha.server.trade.domain.CategoryJpaRepository;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeImage;
import com.gachi.gacha.server.trade.domain.TradeImageJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.domain.TradeSpecifications;
import com.gachi.gacha.server.trade.domain.TradeStatus;
import com.gachi.gacha.server.trade.domain.exception.CategoryNotFoundException;
import com.gachi.gacha.server.trade.domain.exception.TradeAccessDeniedException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class TradeService {

    private final TradeJpaRepository tradeJpaRepository;
    private final TradeImageJpaRepository tradeImageRepository;
    private final CategoryJpaRepository categoryRepository;
    private final MemberJpaRepository memberJpaRepository;
    private final MultipartUploader multipartUploader;
    private final S3TransactionManager s3TransactionManager;

    @Transactional
    public TradeInfo createTrade(
            final Long memberId,
            final TradeCreateCommand command,
            final List<MultipartFile> images
    ) {
        Member member = getMember(memberId);

        Trade trade = Trade.builder()
                .member(member)
                .title(command.title())
                .description(command.description())
                .desiredProduction(command.desiredProduction())
                .purchaseStore(command.purchaseStore())
                .tradePlace(command.tradePlace())
                .availableTime(command.availableTime())
                .status(TradeStatus.AVAILABLE)
                .build();
        trade.replaceCategories(findCategories(command.categoryIds()));
        tradeJpaRepository.save(trade);

        List<String> imageUrls = uploadImages(trade, images);

        return TradeInfo.of(trade, imageUrls);
    }

    public Page<TradeSummaryInfo> findAllByMemberId(final Long memberId, final TradeStatus status, final Pageable pageable) {
        if (status == null) {
            return findAllByMemberId(memberId, pageable);
        }
        return findAllByMemberIdAndStatus(memberId, status, pageable);
    }

    public Page<TradeSummaryInfo> findTrades(final TradeSearchCondition condition, final Pageable pageable) {
        // 1단계: 필터와 페이징만 적용한다. 컬렉션을 건드리지 않으므로 페이징이 DB에서 정상적으로 끝난다.
        Page<Trade> tradePage = tradeJpaRepository.findAll(
                TradeSpecifications.search(
                        normalizeKeyword(condition.keyword()), condition.categoryIds(), condition.status()),
                pageable
        );

        // 2단계: 이 페이지의 게시글만 카테고리와 함께 다시 가져온다(카테고리 N+1 제거).
        // 1단계와 같은 영속성 컨텍스트라 돌아오는 것은 같은 인스턴스이고, 이 조회로 컬렉션이 채워진다.
        return getTradeSummaryInfos(pageable, tradePage);
    }

    public TradeInfo findTrade(final Long tradeId) {
        Trade trade = tradeJpaRepository.getByIdWithCategories(tradeId);

        return TradeInfo.of(trade, findImageUrls(tradeId));
    }

    @Transactional
    public TradeInfo updateTrade(
            final Long memberId,
            final Long tradeId,
            final TradeUpdateCommand command,
            final List<MultipartFile> images
    ) {
        Trade trade = tradeJpaRepository.getByIdWithCategories(tradeId);
        validateOwner(trade, memberId);

        trade.update(
                command.title(),
                command.description(),
                command.desiredProduction(),
                command.purchaseStore(),
                command.tradePlace(),
                command.availableTime()
        );
        trade.replaceCategories(findCategories(command.categoryIds()));

        List<String> imageUrls = replaceImages(trade, images);

        return TradeInfo.of(trade, imageUrls);
    }

    @Transactional
    public TradeInfo changeStatus(final Long memberId, final Long tradeId, final TradeStatus status) {
        Trade trade = tradeJpaRepository.getByIdWithCategories(tradeId);
        validateOwner(trade, memberId);

        trade.changeStatus(status);

        return TradeInfo.of(trade, findImageUrls(tradeId));
    }

    @Transactional
    public void removeTrade(final Long memberId, final Long tradeId) {
        Trade trade = tradeJpaRepository.getById(tradeId);
        validateOwner(trade, memberId);

        List<TradeImage> tradeImages = tradeImageRepository.findAllByTradeIdOrderByIdAsc(tradeId);
        List<String> imageUrls = tradeImages.stream()
                .map(TradeImage::getImageUrl)
                .toList();

        tradeImageRepository.deleteAll(tradeImages);
        tradeJpaRepository.delete(trade);

        // 사용자가 올린 콘텐츠라 오삭제·신고 대응 여지를 남기기 위해 완전 삭제가 아닌 휴지통으로 옮긴다.
        s3TransactionManager.trashImagesAfterRemoved(DomainType.TRADE, tradeId, imageUrls);
    }

    /**
     * 앞뒤 공백만 있는 검색어는 "검색어 없음"으로 본다. 그대로 넘기면 LIKE '% %' 가 되어 엉뚱하게 걸러진다.
     */
    private String normalizeKeyword(final String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        return keyword.trim();
    }

    private Member getMember(final Long memberId) {
        return memberJpaRepository.getMemberById(memberId);
    }

    private void validateOwner(final Trade trade, final Long memberId) {
        if (!trade.isOwnedBy(memberId)) {
            throw new TradeAccessDeniedException(ErrorCode.TRADE_ACCESS_DENIED);
        }
    }

    /**
     * 요청한 카테고리 ID가 하나라도 실재하지 않으면 등록을 막는다. 사용자가 무작위로 카테고리를 생성함을 막기 위함이다.
     */
    private List<Category> findCategories(final List<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return List.of();
        }

        List<Long> distinctIds = List.copyOf(new HashSet<>(categoryIds));
        List<Category> categories = categoryRepository.findAllById(distinctIds);
        if (categories.size() != distinctIds.size()) {
            throw new CategoryNotFoundException(ErrorCode.CATEGORY_NOT_FOUND);
        }
        return categories;
    }

    /**
     * 업로드는 지금 일어나지만 DB 저장은 커밋 시점에야 확정된다. 그래서 업로드를 시작하기 전에 롤백 훅을
     * 먼저 걸어 두고, 훅이 바라보는 리스트에 업로드한 URL을 누적한다. 중간에 실패해도 그때까지 올라간 파일이 정리된다.
     */
    private List<String> uploadImages(final Trade trade, final List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return List.of();
        }

        List<String> uploadedUrls = new ArrayList<>();
        s3TransactionManager.deleteImagesOnRollback(DomainType.TRADE, trade.getId(), uploadedUrls);

        for (MultipartFile image : images) {
            String imageUrl = multipartUploader.upload(image, DomainType.TRADE);
            uploadedUrls.add(imageUrl);
            tradeImageRepository.save(TradeImage.builder()
                    .trade(trade)
                    .imageUrl(imageUrl)
                    .build());
        }

        return uploadedUrls;
    }

    /**
     * 수정 요청에 이미지가 실려 있으면 기존 이미지를 전부 교체하고, 없으면 그대로 둔다.
     */
    private List<String> replaceImages(final Trade trade, final List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return findImageUrls(trade.getId());
        }

        List<TradeImage> oldImages = tradeImageRepository.findAllByTradeIdOrderByIdAsc(trade.getId());
        List<String> oldImageUrls = oldImages.stream()
                .map(TradeImage::getImageUrl)
                .toList();
        tradeImageRepository.deleteAll(oldImages);
        s3TransactionManager.trashImagesAfterRemoved(DomainType.TRADE, trade.getId(), oldImageUrls);

        return uploadImages(trade, images);
    }

    private List<String> findImageUrls(final Long tradeId) {
        return tradeImageRepository.findAllByTradeIdOrderByIdAsc(tradeId).stream()
                .map(TradeImage::getImageUrl)
                .toList();
    }

    private Map<Long, List<String>> findImageUrlsByTradeIds(final List<Long> tradeIds) {
        return tradeImageRepository.findAllByTradeIdInOrderByIdAsc(tradeIds).stream()
                .collect(Collectors.groupingBy(
                        tradeImage -> tradeImage.getTrade().getId(),
                        Collectors.mapping(TradeImage::getImageUrl, Collectors.toList())
                ));
    }

    private Page<TradeSummaryInfo> findAllByMemberId(final Long memberId, final Pageable pageable) {
        Page<Trade> tradePage = tradeJpaRepository.findAllByMemberId(memberId, pageable);
        return getTradeSummaryInfos(pageable, tradePage);
    }

    private Page<TradeSummaryInfo> findAllByMemberIdAndStatus(final Long memberId, final TradeStatus status, final Pageable pageable) {
        Page<Trade> tradePage = tradeJpaRepository.findAllByMemberIdAndStatus(memberId, status, pageable);
        return getTradeSummaryInfos(pageable, tradePage);
    }

    private PageImpl<TradeSummaryInfo> getTradeSummaryInfos(final Pageable pageable, final Page<Trade> tradePage) {
        List<Long> tradeIds = tradePage.stream()
                .map(Trade::getId)
                .toList();

        if (tradeIds.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, tradePage.getTotalElements());
        }

        Map<Long, Trade> tradeById = tradeJpaRepository.findByIdsWithCategories(tradeIds).stream()
                .collect(Collectors.toMap(Trade::getId, Function.identity()));

        Map<Long, List<String>> imageUrlsByTradeIds = findImageUrlsByTradeIds(tradeIds);

        List<TradeSummaryInfo> content = tradeIds.stream()
                .map(tradeById::get)
                .map(trade -> TradeSummaryInfo.of(trade, imageUrlsByTradeIds.getOrDefault(trade.getId(), List.of())))
                .toList();
        return new PageImpl<>(content, pageable, tradePage.getTotalElements());
    }
}

package com.gachi.gacha.server.trade.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

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
import com.gachi.gacha.server.trade.domain.TradeStatus;
import com.gachi.gacha.server.trade.domain.exception.CategoryNotFoundException;
import com.gachi.gacha.server.trade.domain.exception.TradeAccessDeniedException;
import com.gachi.gacha.server.trade.domain.Place;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
class TradeServiceTest {

    private static final Long OWNER_ID = 1L;
    private static final Long OTHER_MEMBER_ID = 2L;
    private static final Long TRADE_ID = 10L;

    @Mock
    private TradeJpaRepository tradeRepository;

    @Mock
    private TradeImageJpaRepository tradeImageRepository;

    @Mock
    private CategoryJpaRepository categoryRepository;

    @Mock
    private MemberJpaRepository memberJpaRepository;

    @Mock
    private MultipartUploader multipartUploader;

    @Mock
    private S3TransactionManager s3TransactionManager;

    @InjectMocks
    private TradeService tradeService;

    private Member owner;

    @BeforeEach
    void setUp() {
        owner = Member.builder()
                .id(OWNER_ID)
                .nickname("주인")
                .build();
    }

    private Trade createTrade() {
        Trade trade = Trade.builder()
                .id(TRADE_ID)
                .member(owner)
                .title("쿠로미 피규어 교환해요")
                .description("개봉만 한 상품입니다.")
                .desiredProduction("시나모롤")
                .purchaseStore(new Place("가챠샵 홍대점", "서울특별시 마포구 양화로 100", 37.5563, 126.9236))
                .tradePlace(new Place("홍대입구역 8번 출구", "서울특별시 마포구 양화로 160", 37.5570, 126.9245))
                .availableTime(LocalDateTime.of(2026, 9, 20, 19, 0))
                .status(TradeStatus.AVAILABLE)
                .build();
        trade.replaceCategories(List.of(new Category(1L, "피규어")));
        return trade;
    }

    private MultipartFile image(final String name) {
        return new MockMultipartFile("images", name, "image/png", "dummy".getBytes());
    }

    @Nested
    @DisplayName("createTrade")
    class CreateTrade {

        @Test
        @DisplayName("게시글과 카테고리를 저장하고, 이미지를 업로드해 URL을 함께 반환한다.")
        void createsTradeWithImages() {
            // given
            given(memberJpaRepository.getMemberById(OWNER_ID)).willReturn(owner);
            given(categoryRepository.findAllById(anyList())).willReturn(List.of(new Category(1L, "피규어")));
            given(multipartUploader.upload(any(MultipartFile.class), any()))
                    .willReturn("https://bucket.s3.amazonaws.com/gachigacha/trade/first.png")
                    .willReturn("https://bucket.s3.amazonaws.com/gachigacha/trade/second.png");

            TradeCreateCommand command = TradeCreateCommand.builder()
                    .title("쿠로미 피규어 교환해요")
                    .categoryIds(List.of(1L))
                    .description("개봉만 한 상품입니다.")
                    .build();

            // when
            TradeInfo tradeInfo = tradeService.createTrade(
                    OWNER_ID, command, List.of(image("first.png"), image("second.png")));

            // then
            assertThat(tradeInfo.title()).isEqualTo("쿠로미 피규어 교환해요");
            assertThat(tradeInfo.status()).isEqualTo(TradeStatus.AVAILABLE);
            assertThat(tradeInfo.categories()).containsExactly("피규어");
            assertThat(tradeInfo.imageUrls()).hasSize(2);
            verify(tradeRepository).save(any(Trade.class));
        }

        @Test
        @DisplayName("업로드 전에 롤백 훅을 먼저 등록해, 중간에 실패해도 이미 올라간 파일이 정리되게 한다.")
        void registersRollbackHookBeforeUploading() {
            // given
            given(memberJpaRepository.getMemberById(OWNER_ID)).willReturn(owner);
            given(multipartUploader.upload(any(MultipartFile.class), any()))
                    .willReturn("https://bucket.s3.amazonaws.com/gachigacha/trade/first.png")
                    .willThrow(new RuntimeException("업로드 실패"));

            TradeCreateCommand command = TradeCreateCommand.builder()
                    .title("쿠로미 피규어 교환해요")
                    .build();
            List<MultipartFile> images = List.of(image("first.png"), image("second.png"));

            // when
            assertThatThrownBy(() -> tradeService.createTrade(OWNER_ID, command, images))
                    .isInstanceOf(RuntimeException.class);

            // then: 훅에 넘긴 리스트에 첫 번째 업로드 결과가 누적돼 있어야 롤백 시 삭제될 수 있다.
            verify(s3TransactionManager).deleteImagesOnRollback(
                    eq(DomainType.TRADE),
                    any(),
                    eq(List.of("https://bucket.s3.amazonaws.com/gachigacha/trade/first.png"))
            );
        }

        @Test
        @DisplayName("존재하지 않는 카테고리 ID가 섞여 있으면 등록을 거부한다.")
        void rejectsUnknownCategoryId() {
            // given
            given(memberJpaRepository.getMemberById(OWNER_ID)).willReturn(owner);
            given(categoryRepository.findAllById(anyList())).willReturn(List.of(new Category(1L, "피규어")));

            TradeCreateCommand command = TradeCreateCommand.builder()
                    .title("쿠로미 피규어 교환해요")
                    .categoryIds(List.of(1L, 999L))
                    .build();

            // when & then
            assertThatThrownBy(() -> tradeService.createTrade(OWNER_ID, command, List.of()))
                    .isInstanceOf(CategoryNotFoundException.class)
                    .hasMessage(ErrorCode.CATEGORY_NOT_FOUND.getMessage());
            verify(tradeRepository, never()).save(any(Trade.class));
        }
    }

    @Nested
    @DisplayName("findTrades")
    class FindTrades {

        @Test
        @DisplayName("이미지 목록의 첫 번째 사진을 썸네일로 내려준다.")
        void buildsThumbnailFromFirstImage() {
            // given
            Trade trade = createTrade();
            Pageable pageable = PageRequest.of(0, 20);
            Page<Trade> tradePage = new PageImpl<>(List.of(trade), pageable, 1);

            given(tradeRepository.findAll(any(Specification.class), eq(pageable))).willReturn(tradePage);
            given(tradeRepository.findByIdsWithCategories(List.of(TRADE_ID))).willReturn(List.of(trade));
            given(tradeImageRepository.findAllByTradeIdInOrderByIdAsc(List.of(TRADE_ID))).willReturn(List.of(
                    TradeImage.builder().trade(trade).imageUrl("https://bucket.s3.amazonaws.com/first.png").build(),
                    TradeImage.builder().trade(trade).imageUrl("https://bucket.s3.amazonaws.com/second.png").build()
            ));

            // when
            Page<TradeSummaryInfo> page = tradeService.findTrades(
                    TradeSearchCondition.builder().build(), pageable);

            // then
            assertThat(page.getTotalElements()).isEqualTo(1);
            assertThat(page.getContent().getFirst().thumbnailUrl())
                    .isEqualTo("https://bucket.s3.amazonaws.com/first.png");
            assertThat(page.getContent().getFirst().categories()).containsExactly("피규어");
        }

        @Test
        @DisplayName("결과가 비어 있으면 추가 조회 없이 빈 페이지를 반환한다.")
        void returnsEmptyPageWithoutExtraQuery() {
            // given
            Pageable pageable = PageRequest.of(0, 20);
            given(tradeRepository.findAll(any(Specification.class), eq(pageable)))
                    .willReturn(new PageImpl<>(List.of(), pageable, 0));

            // when
            Page<TradeSummaryInfo> page = tradeService.findTrades(
                    TradeSearchCondition.builder().build(), pageable);

            // then
            assertThat(page.getContent()).isEmpty();
            verify(tradeRepository, never()).findByIdsWithCategories(anyList());
            verify(tradeImageRepository, never()).findAllByTradeIdInOrderByIdAsc(anyList());
        }
    }

    @Nested
    @DisplayName("updateTrade")
    class UpdateTrade {

        @Test
        @DisplayName("전체 교체이므로, 보내지 않은 선택 필드는 기존 값이 유지되지 않고 비워진다.")
        void replacesEveryFieldWithTheRequest() {
            // given
            Trade trade = createTrade();
            given(tradeRepository.getByIdWithCategories(TRADE_ID)).willReturn(trade);

            TradeUpdateCommand command = TradeUpdateCommand.builder()
                    .title("제목만 보냅니다")
                    .build();

            // when
            TradeInfo tradeInfo = tradeService.updateTrade(OWNER_ID, TRADE_ID, command, null);

            // then
            assertThat(tradeInfo.title()).isEqualTo("제목만 보냅니다");
            assertThat(tradeInfo.description()).isNull();
            assertThat(tradeInfo.tradePlace()).isNull();
            assertThat(tradeInfo.availableTime()).isNull();
            assertThat(tradeInfo.categories()).isEmpty();
        }

        @Test
        @DisplayName("이미지는 전체 교체 대상이 아니어서, 보내지 않으면 기존 이미지가 유지된다.")
        void keepsImagesWhenNotProvided() {
            // given
            Trade trade = createTrade();
            given(tradeRepository.getByIdWithCategories(TRADE_ID)).willReturn(trade);
            given(tradeImageRepository.findAllByTradeIdOrderByIdAsc(TRADE_ID)).willReturn(List.of(
                    TradeImage.builder().trade(trade).imageUrl("https://bucket.s3.amazonaws.com/kept.png").build()
            ));

            TradeUpdateCommand command = TradeUpdateCommand.builder().title("제목").build();

            // when
            TradeInfo tradeInfo = tradeService.updateTrade(OWNER_ID, TRADE_ID, command, null);

            // then
            assertThat(tradeInfo.imageUrls()).containsExactly("https://bucket.s3.amazonaws.com/kept.png");
            verify(s3TransactionManager, never()).trashImagesAfterRemoved(any(), any(), anyList());
        }

        @Test
        @DisplayName("이미지를 함께 보내면 기존 이미지를 휴지통으로 옮기고 새 이미지로 교체한다.")
        void replacesImagesWhenProvided() {
            // given
            Trade trade = createTrade();
            given(tradeRepository.getByIdWithCategories(TRADE_ID)).willReturn(trade);
            given(tradeImageRepository.findAllByTradeIdOrderByIdAsc(TRADE_ID)).willReturn(List.of(
                    TradeImage.builder().trade(trade).imageUrl("https://bucket.s3.amazonaws.com/old.png").build()
            ));
            given(multipartUploader.upload(any(MultipartFile.class), any()))
                    .willReturn("https://bucket.s3.amazonaws.com/new.png");

            // when
            TradeInfo tradeInfo = tradeService.updateTrade(
                    OWNER_ID, TRADE_ID, TradeUpdateCommand.builder().title("제목").build(), List.of(image("new.png")));

            // then
            assertThat(tradeInfo.imageUrls()).containsExactly("https://bucket.s3.amazonaws.com/new.png");
            verify(s3TransactionManager).trashImagesAfterRemoved(
                    DomainType.TRADE, TRADE_ID, List.of("https://bucket.s3.amazonaws.com/old.png"));
        }

        @Test
        @DisplayName("작성자가 아니면 수정할 수 없다.")
        void rejectsNonOwner() {
            // given
            given(tradeRepository.getByIdWithCategories(TRADE_ID)).willReturn(createTrade());

            TradeUpdateCommand command = TradeUpdateCommand.builder().title("남의 글 수정").build();

            // when & then
            assertThatThrownBy(() -> tradeService.updateTrade(OTHER_MEMBER_ID, TRADE_ID, command, null))
                    .isInstanceOf(TradeAccessDeniedException.class)
                    .hasMessage(ErrorCode.TRADE_ACCESS_DENIED.getMessage());
        }
    }

    @Nested
    @DisplayName("changeStatus")
    class ChangeStatus {

        @Test
        @DisplayName("작성자는 상태를 변경할 수 있고, 되돌리기에도 제약이 없다.")
        void changesStatusFreely() {
            // given
            Trade trade = createTrade();
            given(tradeRepository.getByIdWithCategories(TRADE_ID)).willReturn(trade);

            // when
            tradeService.changeStatus(OWNER_ID, TRADE_ID, TradeStatus.COMPLETED);
            TradeInfo tradeInfo = tradeService.changeStatus(OWNER_ID, TRADE_ID, TradeStatus.AVAILABLE);

            // then
            assertThat(tradeInfo.status()).isEqualTo(TradeStatus.AVAILABLE);
        }

        @Test
        @DisplayName("작성자가 아니면 상태를 변경할 수 없다.")
        void rejectsNonOwner() {
            // given
            given(tradeRepository.getByIdWithCategories(TRADE_ID)).willReturn(createTrade());

            // when & then
            assertThatThrownBy(() -> tradeService.changeStatus(OTHER_MEMBER_ID, TRADE_ID, TradeStatus.COMPLETED))
                    .isInstanceOf(TradeAccessDeniedException.class);
        }
    }

    @Nested
    @DisplayName("removeTrade")
    class RemoveTrade {

        @Test
        @DisplayName("게시글을 삭제하면서 딸린 이미지를 휴지통으로 옮긴다.")
        void movesImagesToTrash() {
            // given
            Trade trade = createTrade();
            given(tradeRepository.getById(TRADE_ID)).willReturn(trade);
            given(tradeImageRepository.findAllByTradeIdOrderByIdAsc(TRADE_ID)).willReturn(List.of(
                    TradeImage.builder().trade(trade).imageUrl("https://bucket.s3.amazonaws.com/one.png").build()
            ));

            // when
            tradeService.removeTrade(OWNER_ID, TRADE_ID);

            // then
            verify(tradeRepository).delete(trade);
            verify(s3TransactionManager).trashImagesAfterRemoved(
                    DomainType.TRADE, TRADE_ID, List.of("https://bucket.s3.amazonaws.com/one.png"));
        }

        @Test
        @DisplayName("작성자가 아니면 삭제할 수 없고, S3도 건드리지 않는다.")
        void rejectsNonOwner() {
            // given
            given(tradeRepository.getById(TRADE_ID)).willReturn(createTrade());

            // when & then
            assertThatThrownBy(() -> tradeService.removeTrade(OTHER_MEMBER_ID, TRADE_ID))
                    .isInstanceOf(TradeAccessDeniedException.class);
            verify(tradeRepository, never()).delete(any(Trade.class));
            verify(s3TransactionManager, never()).trashImagesAfterRemoved(any(), any(), anyList());
        }
    }
}

package com.gachi.gacha.server.trade.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.ErrorCause;
import co.elastic.clients.elasticsearch.core.BulkRequest;
import co.elastic.clients.elasticsearch.core.BulkResponse;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.bulk.BulkResponseItem;
import co.elastic.clients.elasticsearch.core.search.Hit;
import co.elastic.clients.elasticsearch.core.search.HitsMetadata;
import co.elastic.clients.util.ObjectBuilder;
import com.gachi.gacha.server.trade.domain.Trade;
import com.gachi.gacha.server.trade.domain.TradeJpaRepository;
import com.gachi.gacha.server.trade.infra.TradeIndexReconciler;
import com.gachi.gacha.server.trade.infra.TradeIndexService;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.function.Function;
import java.util.stream.LongStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TradeIndexReconcilerTest {

    private static final String INDEX = "trade-test";

    @Mock
    private ElasticsearchClient esClient;
    @Mock
    private TradeIndexService tradeIndexService;
    @Mock
    private TradeJpaRepository tradeJpaRepository;

    @InjectMocks
    private TradeIndexReconciler reconciler;

    @BeforeEach
    void setUp() throws IOException {
        ReflectionTestUtils.setField(reconciler, "INDEX", INDEX);

        // 기본값: ES 조회 결과 없음, bulk 성공
        stubSearch(page());
        BulkResponse ok = mock(BulkResponse.class);
        when(ok.errors()).thenReturn(false);
        doReturn(ok).when(esClient).bulk(any(BulkRequest.class));
    }

    @Test
    @DisplayName("reconcile: DB의 글은 색인하고, ES에 고아가 없으면 삭제하지 않는다")
    void reconcile_indexesDbTrades_withoutDeletingAnything() throws Exception {
        when(tradeJpaRepository.findIdsAfter(eq(0L), any(Pageable.class))).thenReturn(List.of(1L, 2L, 3L));
        when(tradeJpaRepository.findIdsAfter(eq(3L), any(Pageable.class))).thenReturn(List.of());
        stubSearch(page(1L, 2L, 3L), page());

        reconciler.reconcile();

        verify(tradeIndexService).indexAll(List.of(1L, 2L, 3L));
        verify(esClient, never()).bulk(any(BulkRequest.class));
    }

    @Test
    @DisplayName("reconcile: ES에만 있고 DB에도 없는 문서는 삭제한다")
    void reconcile_deletesOrphans() throws Exception {
        when(tradeJpaRepository.findIdsAfter(eq(0L), any(Pageable.class))).thenReturn(List.of(1L, 2L, 3L));
        when(tradeJpaRepository.findIdsAfter(eq(3L), any(Pageable.class))).thenReturn(List.of());
        stubSearch(page(1L, 2L, 3L, 4L, 5L), page());   // 4, 5는 DB 배치에 없음
        when(tradeJpaRepository.findAllById(any())).thenReturn(List.of());   // DB에도 없음

        reconciler.reconcile();

        assertThat(deletedIds()).containsExactlyInAnyOrder("4", "5");
    }

    @Test
    @DisplayName("reconcile: 배치 이후 새로 생겨 DB에 존재하는 글은 고아로 보지 않는다")
    void reconcile_doesNotDeleteTradeThatExistsInDb() throws Exception {
        when(tradeJpaRepository.findIdsAfter(eq(0L), any(Pageable.class))).thenReturn(List.of(1L, 2L, 3L));
        when(tradeJpaRepository.findIdsAfter(eq(3L), any(Pageable.class))).thenReturn(List.of());
        stubSearch(page(1L, 2L, 3L, 4L), page());

        Trade trade4 = trade(4L);
        when(tradeJpaRepository.findAllById(any())).thenReturn(List.of(trade4));   // 4는 DB에 있음

        reconciler.reconcile();

        verify(esClient, never()).bulk(any(BulkRequest.class));
    }

    @Test
    @DisplayName("reconcile: 마지막 ID 이후 구간의 고아도 삭제한다")
    void reconcile_deletesOrphansAfterLastDbId() throws Exception {
        // DB에는 글이 하나도 없고, ES에만 10, 11이 남아 있음
        stubSearch(page(10L, 11L));

        reconciler.reconcile();

        assertThat(deletedIds()).containsExactlyInAnyOrder("10", "11");
    }

    @Test
    @DisplayName("reconcile: 한 구간의 고아가 페이지 크기를 넘어도 끝까지 삭제한다")
    void reconcile_deletesOrphansAcrossMultiplePages() throws Exception {
        Long[] firstPage = LongStream.rangeClosed(1, 1_000).boxed().toArray(Long[]::new);   // 가득 찬 페이지
        stubSearch(page(firstPage), page(1_001L, 1_002L));                                  // 마지막 페이지

        reconciler.reconcile();

        verify(esClient, times(2)).bulk(any(BulkRequest.class));
        assertThat(deletedIds()).hasSize(1_002);
    }

    @Test
    @DisplayName("reconcile: 한 배치가 실패해도 다음 배치를 계속 처리한다")
    void reconcile_continuesAfterBatchFailure() throws Exception {
        when(tradeJpaRepository.findIdsAfter(eq(0L), any(Pageable.class))).thenReturn(List.of(1L, 2L));
        when(tradeJpaRepository.findIdsAfter(eq(2L), any(Pageable.class))).thenReturn(List.of(3L));
        when(tradeJpaRepository.findIdsAfter(eq(3L), any(Pageable.class))).thenReturn(List.of());
        doThrow(new IllegalStateException("색인 실패")).when(tradeIndexService).indexAll(List.of(1L, 2L));

        assertThatCode(() -> reconciler.reconcile()).doesNotThrowAnyException();

        verify(tradeIndexService).indexAll(List.of(3L));
    }

    @Test
    @DisplayName("reconcile: 고아 삭제 bulk가 실패해도 예외가 밖으로 나가지 않는다")
    void reconcile_doesNotThrow_whenOrphanDeleteFails() throws Exception {
        stubSearch(page(10L));
        doReturn(failedBulk("10")).when(esClient).bulk(any(BulkRequest.class));

        assertThatCode(() -> reconciler.reconcile()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("reconcile: ES 조회는 페이지 크기와 tradeId 오름차순 정렬로 요청한다")
    @SuppressWarnings({"unchecked", "rawtypes"})
    void reconcile_requestsSortedPage() throws Exception {
        reconciler.reconcile();

        ArgumentCaptor<Function> captor = ArgumentCaptor.forClass(Function.class);
        verify(esClient, atLeastOnce()).search(captor.capture(), eq(Void.class));
        Object built = captor.getValue().apply(new SearchRequest.Builder());
        SearchRequest request = ((ObjectBuilder<SearchRequest>) built).build();

        assertThat(request.index()).containsExactly(INDEX);
        assertThat(request.size()).isEqualTo(1_000);
        assertThat(request.sort()).hasSize(1);
    }

    @Test
    @DisplayName("syncRecent: 첫 실행은 24시간 전 + 겹침(2분)부터 조회한다")
    void syncRecent_firstRun_usesStartupLookback() {
        reconciler.syncRecent();

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(tradeJpaRepository).findIdsModifiedAfter(captor.capture());
        LocalDateTime expected = LocalDateTime.now().minusHours(24).minusMinutes(2);
        assertThat(captor.getValue()).isBetween(expected.minusSeconds(5), expected.plusSeconds(5));
    }

    @Test
    @DisplayName("syncRecent: 이전 성공 시각이 있으면 그 시각 − 2분부터 조회한다")
    void syncRecent_usesLastSyncedAt() {
        LocalDateTime last = LocalDateTime.now().minusHours(1);
        ReflectionTestUtils.setField(reconciler, "lastSyncedAt", last);

        reconciler.syncRecent();

        verify(tradeJpaRepository).findIdsModifiedAfter(last.minusMinutes(2));
    }

    @Test
    @DisplayName("syncRecent: 변경이 없어도 성공으로 보고 기준 시각을 전진시킨다")
    void syncRecent_advancesLastSyncedAt_whenNothingChanged() {
        when(tradeJpaRepository.findIdsModifiedAfter(any())).thenReturn(List.of());

        reconciler.syncRecent();

        assertThat(ReflectionTestUtils.getField(reconciler, "lastSyncedAt")).isNotNull();
    }

    @Test
    @DisplayName("syncRecent: 전부 성공하면 기준 시각을 전진시킨다")
    void syncRecent_advancesLastSyncedAt_onSuccess() {
        when(tradeJpaRepository.findIdsModifiedAfter(any())).thenReturn(List.of(1L, 2L));

        reconciler.syncRecent();

        assertThat(ReflectionTestUtils.getField(reconciler, "lastSyncedAt")).isNotNull();
    }

    @Test
    @DisplayName("syncRecent: 한 배치라도 실패하면 기준 시각을 전진시키지 않는다")
    void syncRecent_doesNotAdvanceLastSyncedAt_onFailure() throws Exception {
        when(tradeJpaRepository.findIdsModifiedAfter(any())).thenReturn(List.of(1L, 2L));
        doThrow(new IllegalStateException("색인 실패")).when(tradeIndexService).indexAll(anyList());

        reconciler.syncRecent();

        assertThat(ReflectionTestUtils.getField(reconciler, "lastSyncedAt")).isNull();
    }

    @Test
    @DisplayName("syncRecent: 변경된 글을 배치 크기(500)로 나눠 색인한다")
    void syncRecent_splitsIntoBatches() throws Exception {
        List<Long> ids = LongStream.rangeClosed(1, 1_200).boxed().toList();
        when(tradeJpaRepository.findIdsModifiedAfter(any())).thenReturn(ids);

        reconciler.syncRecent();

        verify(tradeIndexService, times(3)).indexAll(anyList());   // 500 + 500 + 200
    }

    @Test
    @DisplayName("reconcile: 전부 성공하면 lastSyncedAt을 점검 '시작' 시각으로 갱신한다")
    void reconcile_advancesLastSyncedAt_toStartTime_onSuccess() {
        when(tradeJpaRepository.findIdsAfter(eq(0L), any(Pageable.class))).thenReturn(List.of(1L, 2L));
        when(tradeJpaRepository.findIdsAfter(eq(2L), any(Pageable.class))).thenReturn(List.of());

        LocalDateTime before = LocalDateTime.now();
        reconciler.reconcile();
        LocalDateTime after = LocalDateTime.now();

        LocalDateTime synced = (LocalDateTime) ReflectionTestUtils.getField(reconciler, "lastSyncedAt");
        assertThat(synced).isBetween(before, after);
    }

    @Test
    @DisplayName("reconcile: 색인 배치가 실패하면 lastSyncedAt을 갱신하지 않는다")
    void reconcile_doesNotAdvanceLastSyncedAt_onBatchFailure() throws Exception {
        when(tradeJpaRepository.findIdsAfter(eq(0L), any(Pageable.class))).thenReturn(List.of(1L, 2L));
        when(tradeJpaRepository.findIdsAfter(eq(2L), any(Pageable.class))).thenReturn(List.of());
        doThrow(new IllegalStateException("색인 실패")).when(tradeIndexService).indexAll(List.of(1L, 2L));

        reconciler.reconcile();

        assertThat(ReflectionTestUtils.getField(reconciler, "lastSyncedAt")).isNull();
    }

    @Test
    @DisplayName("reconcile: 고아 삭제가 실패해도 lastSyncedAt을 갱신하지 않는다")
    void reconcile_doesNotAdvanceLastSyncedAt_onOrphanDeleteFailure() throws Exception {
        stubSearch(page(10L));
        doReturn(failedBulk("10")).when(esClient).bulk(any(BulkRequest.class));

        reconciler.reconcile();

        assertThat(ReflectionTestUtils.getField(reconciler, "lastSyncedAt")).isNull();
    }

    @Test
    @DisplayName("reconcile: 이미 더 최신인 lastSyncedAt을 과거 시각으로 되돌리지 않는다")
    void reconcile_doesNotMoveLastSyncedAtBackward() {
        LocalDateTime newer = LocalDateTime.now().plusHours(1);
        ReflectionTestUtils.setField(reconciler, "lastSyncedAt", newer);

        reconciler.reconcile();

        assertThat(ReflectionTestUtils.getField(reconciler, "lastSyncedAt")).isEqualTo(newer);
    }

    @Test
    @DisplayName("syncRecent: lastSyncedAt이 24시간보다 오래됐으면 24시간 전 + 겹침(2분)으로 제한한다")
    void syncRecent_capsLookbackAt24Hours() {
        ReflectionTestUtils.setField(reconciler, "lastSyncedAt", LocalDateTime.now().minusDays(3));

        reconciler.syncRecent();

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(tradeJpaRepository).findIdsModifiedAfter(captor.capture());
        LocalDateTime expected = LocalDateTime.now().minusHours(24).minusMinutes(2);
        assertThat(captor.getValue()).isBetween(expected.minusSeconds(5), expected.plusSeconds(5));
    }

    // ---------- helpers ----------

    /** 호출 순서대로 ES 조회 결과를 돌려준다. 마지막 값 이후의 호출은 마지막 값을 반복한다. */
    @SuppressWarnings({"unchecked", "rawtypes"})
    private void stubSearch(final SearchResponse<Void> first, final SearchResponse<Void>... rest) throws IOException {
        doReturn(first, (Object[]) rest).when(esClient).search(any(Function.class), eq(Void.class));
    }

    @SuppressWarnings("unchecked")
    private SearchResponse<Void> page(final Long... ids) {
        List<Hit<Void>> hits = Arrays.stream(ids)
                .map(id -> {
                    Hit<Void> hit = mock(Hit.class);
                    when(hit.id()).thenReturn(String.valueOf(id));
                    return hit;
                })
                .toList();
        HitsMetadata<Void> metadata = mock(HitsMetadata.class);
        when(metadata.hits()).thenReturn(hits);
        SearchResponse<Void> response = mock(SearchResponse.class);
        when(response.hits()).thenReturn(metadata);
        return response;
    }

    private Trade trade(final Long id) {
        Trade trade = mock(Trade.class);
        doReturn(id).when(trade).getId();
        return trade;
    }

    private BulkResponse failedBulk(final String id) {
        ErrorCause error = mock(ErrorCause.class);
        when(error.type()).thenReturn("test_exception");
        when(error.reason()).thenReturn("삭제 실패");
        BulkResponseItem item = mock(BulkResponseItem.class);
        when(item.id()).thenReturn(id);
        when(item.status()).thenReturn(500);
        when(item.error()).thenReturn(error);
        BulkResponse response = mock(BulkResponse.class);
        when(response.errors()).thenReturn(true);
        when(response.items()).thenReturn(List.of(item));
        return response;
    }

    /** 지금까지 bulk로 전달된 delete 연산의 문서 ID 전체 */
    private List<String> deletedIds() throws IOException {
        ArgumentCaptor<BulkRequest> captor = ArgumentCaptor.forClass(BulkRequest.class);
        verify(esClient, atLeastOnce()).bulk(captor.capture());
        return captor.getAllValues().stream()
                .flatMap(request -> request.operations().stream())
                .filter(operation -> operation.isDelete())
                .map(operation -> operation.delete().id())
                .toList();
    }
}

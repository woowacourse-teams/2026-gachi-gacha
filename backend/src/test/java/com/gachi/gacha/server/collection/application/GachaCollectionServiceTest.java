package com.gachi.gacha.server.collection.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.infra.config.ImageUploader;
import com.gachi.gacha.server.common.infra.exception.S3Exception;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.server.infrastructure.platform.PlatformClient;
import com.gachi.gacha.server.infrastructure.platform.PlatformType;
import com.gachi.gacha.server.infrastructure.platform.dto.PlatformPostDto;
import com.gachi.gacha.server.infrastructure.platform.dto.PlatformPostPage;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class GachaCollectionServiceTest {

    private static final String UPLOADED_URL = "https://test-bucket.s3.amazonaws.com/gachigacha/gacha/uploaded.jpg";

    @Mock
    private GachaJpaRepository gachaRepository;

    @Mock
    private ImageUploader imageUploader;

    private ExecutorService executorService;

    @BeforeEach
    void setUp() {
        executorService = Executors.newFixedThreadPool(2);
    }

    @AfterEach
    void tearDown() {
        executorService.shutdownNow();
    }

    private GachaCollectionService service(final List<PlatformClient> clients) {
        GachaCollectionService service = new GachaCollectionService(clients, gachaRepository, imageUploader, executorService);
        ReflectionTestUtils.setField(service, "s3RootFolder", "gachigacha");
        return service;
    }

    @Test
    @DisplayName("입고 관련 키워드가 없는 게시글은 저장하지 않는다.")
    void collectPostsForShop_skipsPostsWithoutKeyword() {
        // given
        PlatformClient client = new StubPlatformClient(
                new PlatformPostDto("media-1", "그냥 일상 사진입니다", "url1", PlatformType.INSTAGRAM)
        );
        GachaCollectionService service = service(List.of(client));

        // when
        List<Gacha> result = service.collectPostsForShop("shop1");

        // then
        assertThat(result).isEmpty();
        verify(gachaRepository, never()).save(any());
        verify(imageUploader, never()).uploadFromUrl(any(), any());
    }

    @Test
    @DisplayName("caption이 null인 게시글은 저장하지 않는다.")
    void collectPostsForShop_skipsPostsWithNullCaption() {
        // given
        PlatformClient client = new StubPlatformClient(
                new PlatformPostDto("media-1", null, "url1", PlatformType.INSTAGRAM)
        );
        GachaCollectionService service = service(List.of(client));

        // when
        List<Gacha> result = service.collectPostsForShop("shop1");

        // then
        assertThat(result).isEmpty();
        verify(gachaRepository, never()).save(any());
        verify(imageUploader, never()).uploadFromUrl(any(), any());
    }

    @Test
    @DisplayName("이미 수집된 instagramMediaId를 만나면 그 지점에서 수집을 멈춘다.")
    void collectPostsForShop_stopsAtAlreadyCollectedMedia() {
        // given
        PlatformClient client = new StubPlatformClient(
                new PlatformPostDto("media-1", "입고 안내", "url1", PlatformType.INSTAGRAM)
        );
        when(gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(List.of("media-1"))).thenReturn(List.of("media-1"));
        GachaCollectionService service = service(List.of(client));

        // when
        List<Gacha> result = service.collectPostsForShop("shop1");

        // then
        assertThat(result).isEmpty();
        verify(gachaRepository, never()).save(any());
        verify(imageUploader, never()).uploadFromUrl(any(), any());
    }

    @Test
    @DisplayName("키워드가 포함되고 중복되지 않은 게시글은 S3 업로드 후 저장한다.")
    void collectPostsForShop_savesNewKeywordMatchedPosts() {
        // given
        PlatformClient client = new StubPlatformClient(
                new PlatformPostDto("media-1", "신상 입고", "url1", PlatformType.INSTAGRAM),
                new PlatformPostDto("media-2", "재입고 되었습니다", "url2", PlatformType.INSTAGRAM)
        );
        when(gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(any())).thenReturn(List.of());
        when(imageUploader.uploadFromUrl(any(), any())).thenReturn(UPLOADED_URL);
        when(gachaRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        GachaCollectionService service = service(List.of(client));

        // when
        List<Gacha> result = service.collectPostsForShop("shop1");

        // then
        assertThat(result).hasSize(2);
        assertThat(result).extracting(Gacha::getInstagramMediaId)
                .containsExactlyInAnyOrder("media-1", "media-2");
        assertThat(result).extracting(Gacha::getThumbnailUrl).containsOnly(UPLOADED_URL);
    }

    @Test
    @DisplayName("한 플랫폼 클라이언트에서 예외가 발생해도 다른 클라이언트의 수집은 계속된다.")
    void collectPostsForShop_onePlatformClientFails_othersStillCollected() {
        // given
        PlatformClient failingClient = new FailingPlatformClient();
        PlatformClient workingClient = new StubPlatformClient(
                new PlatformPostDto("media-1", "신상 입고", "url1", PlatformType.INSTAGRAM)
        );
        when(gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(any())).thenReturn(List.of());
        when(imageUploader.uploadFromUrl(any(), any())).thenReturn(UPLOADED_URL);
        when(gachaRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        GachaCollectionService service = service(List.of(failingClient, workingClient));

        // when
        List<Gacha> result = service.collectPostsForShop("shop1");

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getInstagramMediaId()).isEqualTo("media-1");
    }

    @Test
    @DisplayName("한 게시글의 이미지 업로드가 실패해도 나머지 게시글은 계속 저장된다.")
    void collectPostsForShop_oneUploadFails_othersStillSaved() {
        // given
        PlatformClient client = new StubPlatformClient(
                new PlatformPostDto("media-1", "신상 입고", "url1", PlatformType.INSTAGRAM),
                new PlatformPostDto("media-2", "재입고 되었습니다", "url2", PlatformType.INSTAGRAM)
        );
        when(gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(any())).thenReturn(List.of());
        when(imageUploader.uploadFromUrl(eq("url1"), any())).thenThrow(new RuntimeException("업로드 실패"));
        when(imageUploader.uploadFromUrl(eq("url2"), any())).thenReturn(UPLOADED_URL);
        when(gachaRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        GachaCollectionService service = service(List.of(client));

        // when
        List<Gacha> result = service.collectPostsForShop("shop1");

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getInstagramMediaId()).isEqualTo("media-2");
        verify(gachaRepository, never()).save(argThat(gacha -> "media-1".equals(gacha.getInstagramMediaId())));
    }

    @Test
    @DisplayName("한 게시글 저장이 실패해도 나머지 게시글은 계속 저장된다.")
    void collectPostsForShop_oneSaveFails_othersStillSaved() {
        // given
        PlatformClient client = new StubPlatformClient(
                new PlatformPostDto("media-1", "신상 입고", "url1", PlatformType.INSTAGRAM),
                new PlatformPostDto("media-2", "재입고 되었습니다", "url2", PlatformType.INSTAGRAM)
        );
        when(gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(any())).thenReturn(List.of());
        when(imageUploader.uploadFromUrl(any(), any())).thenReturn(UPLOADED_URL);
        when(gachaRepository.save(argThat(gacha -> gacha != null && "media-1".equals(gacha.getInstagramMediaId()))))
                .thenThrow(new RuntimeException("저장 실패"));
        when(gachaRepository.save(argThat(gacha -> gacha != null && "media-2".equals(gacha.getInstagramMediaId()))))
                .thenAnswer(invocation -> invocation.getArgument(0));
        GachaCollectionService service = service(List.of(client));

        // when
        List<Gacha> result = service.collectPostsForShop("shop1");

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getInstagramMediaId()).isEqualTo("media-2");
    }

    @Test
    @DisplayName("업로드가 일시적으로 실패해도 재시도해서 결국 성공하면 저장한다.")
    void collectPostsForShop_uploadFailsOnce_retriesAndSucceeds() {
        // given
        PlatformClient client = new StubPlatformClient(
                new PlatformPostDto("media-1", "신상 입고", "url1", PlatformType.INSTAGRAM)
        );
        when(gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(any())).thenReturn(List.of());
        when(imageUploader.uploadFromUrl(any(), any()))
                .thenThrow(new S3Exception(ErrorCode.S3_IMAGE_UPLOAD_ERROR))
                .thenReturn(UPLOADED_URL);
        when(gachaRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        GachaCollectionService service = service(List.of(client));

        // when
        List<Gacha> result = service.collectPostsForShop("shop1");

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getInstagramMediaId()).isEqualTo("media-1");
        verify(imageUploader, times(2)).uploadFromUrl(any(), any());
    }

    @Test
    @DisplayName("재시도까지 계속 실패하면 더 이상 시도하지 않고 게시글을 포기한다.")
    void collectPostsForShop_uploadKeepsFailing_givesUpAfterMaxAttempts() {
        // given
        PlatformClient client = new StubPlatformClient(
                new PlatformPostDto("media-1", "신상 입고", "url1", PlatformType.INSTAGRAM)
        );
        when(gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(any())).thenReturn(List.of());
        when(imageUploader.uploadFromUrl(any(), any()))
                .thenThrow(new S3Exception(ErrorCode.S3_IMAGE_UPLOAD_ERROR));
        GachaCollectionService service = service(List.of(client));

        // when
        List<Gacha> result = service.collectPostsForShop("shop1");

        // then
        assertThat(result).isEmpty();
        verify(imageUploader, times(2)).uploadFromUrl(any(), any());
        verify(gachaRepository, never()).save(any());
    }

    @Nested
    @DisplayName("페이지네이션")
    class Pagination {

        @Mock
        private PlatformClient platformClient;

        @Test
        @DisplayName("첫 페이지가 전부 신규 게시글이면 커서를 따라 다음 페이지까지 이어서 수집한다.")
        void followsCursor_untilAlreadyCollectedMediaFound() {
            // given
            PlatformPostPage page1 = new PlatformPostPage(
                    List.of(new PlatformPostDto("media-1", "입고 안내", "url1", PlatformType.INSTAGRAM)),
                    "cursor-1"
            );
            PlatformPostPage page2 = new PlatformPostPage(
                    List.of(new PlatformPostDto("media-0", "예전에 수집된 입고 글", "url0", PlatformType.INSTAGRAM)),
                    "cursor-2"
            );
            when(platformClient.fetchRecentPosts(eq("shop1"), isNull())).thenReturn(page1);
            when(platformClient.fetchRecentPosts(eq("shop1"), eq("cursor-1"))).thenReturn(page2);
            when(gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(List.of("media-1"))).thenReturn(List.of());
            when(gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(List.of("media-0"))).thenReturn(List.of("media-0"));
            when(imageUploader.uploadFromUrl(any(), any())).thenReturn(UPLOADED_URL);
            when(gachaRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
            GachaCollectionService service = service(List.of(platformClient));

            // when
            List<Gacha> result = service.collectPostsForShop("shop1");

            // then
            assertThat(result).extracting(Gacha::getInstagramMediaId).containsExactly("media-1");
            verify(platformClient, times(2)).fetchRecentPosts(eq("shop1"), any());
        }

        @Test
        @DisplayName("다음 페이지가 없으면 커서를 더 요청하지 않는다.")
        void stopsWhenNoNextCursor() {
            // given
            PlatformPostPage onlyPage = new PlatformPostPage(
                    List.of(new PlatformPostDto("media-1", "입고 안내", "url1", PlatformType.INSTAGRAM)),
                    null
            );
            when(platformClient.fetchRecentPosts(eq("shop1"), isNull())).thenReturn(onlyPage);
            when(gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(any())).thenReturn(List.of());
            when(imageUploader.uploadFromUrl(any(), any())).thenReturn(UPLOADED_URL);
            when(gachaRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
            GachaCollectionService service = service(List.of(platformClient));

            // when
            List<Gacha> result = service.collectPostsForShop("shop1");

            // then
            assertThat(result).hasSize(1);
            verify(platformClient, times(1)).fetchRecentPosts(eq("shop1"), any());
        }

        @Test
        @DisplayName("이미 수집된 게시글을 계속 만나지 못해도 안전 상한 페이지 수까지만 요청한다.")
        void stopsAtSafetyPageLimit() {
            // given: 매 페이지가 전부 신규이며 다음 커서가 항상 존재하는 상황(무한 백로그)
            when(platformClient.fetchRecentPosts(eq("shop1"), any())).thenAnswer(invocation -> {
                String cursor = invocation.getArgument(1);
                String nextCursor = "next-" + (cursor == null ? "1" : cursor);
                return new PlatformPostPage(
                        List.of(new PlatformPostDto("media-" + nextCursor, "입고 안내", "url", PlatformType.INSTAGRAM)),
                        nextCursor
                );
            });
            when(gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(any())).thenReturn(List.of());
            when(imageUploader.uploadFromUrl(any(), any())).thenReturn(UPLOADED_URL);
            when(gachaRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
            GachaCollectionService service = service(List.of(platformClient));

            // when
            List<Gacha> result = service.collectPostsForShop("shop1");

            // then
            assertThat(result).hasSize(5);
            verify(platformClient, times(5)).fetchRecentPosts(eq("shop1"), any());
        }
    }

    private record StubPlatformClient(List<PlatformPostDto> posts) implements PlatformClient {

        private StubPlatformClient(final PlatformPostDto... posts) {
            this(List.of(posts));
        }

        @Override
        public PlatformPostPage fetchRecentPosts(final String targetId, final String cursor) {
            return new PlatformPostPage(posts, null);
        }

        @Override
        public PlatformType getPlatformType() {
            return PlatformType.INSTAGRAM;
        }
    }

    private static class FailingPlatformClient implements PlatformClient {

        @Override
        public PlatformPostPage fetchRecentPosts(final String targetId, final String cursor) {
            throw new RuntimeException("인스타그램 API 호출 실패");
        }

        @Override
        public PlatformType getPlatformType() {
            return PlatformType.INSTAGRAM;
        }
    }
}

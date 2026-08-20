package com.gachi.gacha.server.collection.application;

import com.gachi.gacha.server.collection.application.exception.GachaCollectionException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.infra.config.ImageType;
import com.gachi.gacha.server.common.infra.config.ImageUploader;
import com.gachi.gacha.server.common.infra.exception.S3Exception;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.server.infrastructure.platform.PlatformClient;
import com.gachi.gacha.server.infrastructure.platform.dto.PlatformPostDto;
import com.gachi.gacha.server.infrastructure.platform.dto.PlatformPostPage;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GachaCollectionService {

    private static final int MAX_PAGES_PER_SHOP = 5;
    private static final int MAX_UPLOAD_ATTEMPTS = 2;
    private static final long UPLOAD_RETRY_DELAY_MS = 500;

    private final List<PlatformClient> platformClients;
    private final GachaJpaRepository gachaRepository;
    private final ImageUploader imageUploader;
    private final ExecutorService gachaImageUploadExecutor;

    @Value("${cloud.aws.s3.folder}")
    private String s3RootFolder;

    public List<Gacha> collectPostsForShop(final String shopInstagramId) {
        List<Gacha> savedGachas = new ArrayList<>();

        for (PlatformClient platformClient : platformClients) {
            savedGachas.addAll(collectFromPlatform(platformClient, shopInstagramId));
        }

        return savedGachas;
    }

    private List<Gacha> collectFromPlatform(final PlatformClient platformClient, final String shopInstagramId) {
        try {
            return collectPagesFromPlatform(platformClient, shopInstagramId);
        } catch (Exception e) {
            log.error("{} 계정 수집 실패: {}", shopInstagramId, e.getMessage());
            return List.of();
        }
    }

    private List<Gacha> collectPagesFromPlatform(final PlatformClient platformClient, final String shopInstagramId) {
        List<Gacha> savedGachas = new ArrayList<>();
        String cursor = null;

        for (int page = 1; page <= MAX_PAGES_PER_SHOP; page++) {
            PlatformPostPage postPage = platformClient.fetchRecentPosts(shopInstagramId, cursor);
            PageResult pageResult = processPosts(postPage.posts());
            savedGachas.addAll(pageResult.savedGachas());

            if (pageResult.reachedAlreadyCollected() || !postPage.hasNext()) {
                return savedGachas;
            }
            if (page == MAX_PAGES_PER_SHOP) {
                log.warn("{}: 페이지 상한({}) 도달, 이전 게시물이 더 남아있을 수 있음", shopInstagramId, MAX_PAGES_PER_SHOP);
                return savedGachas;
            }
            cursor = postPage.nextCursor();
        }

        return savedGachas;
    }

    private PageResult processPosts(final List<PlatformPostDto> posts) {
        FilterResult filterResult = filterPostsToUpload(posts);
        List<Gacha> savedGachas = uploadAndSaveInParallel(filterResult.postsToUpload());

        return new PageResult(savedGachas, filterResult.reachedAlreadyCollected());
    }

    /**
     * 게시글 순서대로 dedup 체크와 키워드 필터를 적용해 업로드 대상 목록을 확정한다. 인스타그램 피드가 최신순이라 순서 자체가 "얼마나 예전 게시물인지"를 의미하므로, 이미 수집된 게시글을 만나는 순간
     * 페이지네이션을 중단해야 한다 - 이 판단은 반드시 순차로 이뤄져야 한다.
     */
    private FilterResult filterPostsToUpload(final List<PlatformPostDto> posts) {
        List<String> mediaIds = posts.stream()
                .map(PlatformPostDto::originalId)
                .toList();
        Set<String> existingMediaIds = new HashSet<>(
                gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(mediaIds));

        List<PlatformPostDto> postsToUpload = new ArrayList<>();
        for (PlatformPostDto post : posts) {
            if (existingMediaIds.contains(post.originalId())) {
                return new FilterResult(postsToUpload, true);
            }
            if (post.content() != null && isGachaKeywordIncluded(post.content())) {
                postsToUpload.add(post);
            }
        }
        return new FilterResult(postsToUpload, false);
    }

    /**
     * 다운로드/S3 업로드/저장은 순서와 무관하므로 전용 스레드풀에서 병렬로 처리한다. 개별 항목이 실패해도 uploadAndSave 내부에서 스킵되므로, 이 메서드는 성공한 것만 모아 반환한다.
     */
    private List<Gacha> uploadAndSaveInParallel(final List<PlatformPostDto> postsToUpload) {
        List<Callable<Optional<Gacha>>> tasks = buildUploadTasks(postsToUpload);
        List<Future<Optional<Gacha>>> futures = invokeTasks(tasks);
        return collectResults(futures);
    }

    private List<Callable<Optional<Gacha>>> buildUploadTasks(final List<PlatformPostDto> postsToUpload) {
        List<Callable<Optional<Gacha>>> tasks = new ArrayList<>();
        for (PlatformPostDto post : postsToUpload) {
            tasks.add(() -> uploadAndSave(post));
        }
        return tasks;
    }

    private List<Future<Optional<Gacha>>> invokeTasks(final List<Callable<Optional<Gacha>>> tasks) {
        try {
            return gachaImageUploadExecutor.invokeAll(tasks);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("이미지 업로드 처리 중 인터럽트가 발생했습니다.", e);
            throw new GachaCollectionException(ErrorCode.GACHA_COLLECTION_FAILED);
        }
    }

    private List<Gacha> collectResults(final List<Future<Optional<Gacha>>> futures) {
        try {
            List<Gacha> savedGachas = new ArrayList<>();
            for (Future<Optional<Gacha>> future : futures) {
                future.get().ifPresent(savedGachas::add);
            }
            return savedGachas;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("이미지 업로드 처리 중 인터럽트가 발생했습니다.", e);
            throw new GachaCollectionException(ErrorCode.GACHA_COLLECTION_FAILED);
        } catch (ExecutionException e) {
            log.error("이미지 업로드 처리 중 알 수 없는 오류가 발생했습니다.", e);
            throw new GachaCollectionException(ErrorCode.GACHA_COLLECTION_FAILED);
        }
    }

    /**
     * 네트워크/DB 일시 장애로 인한 실패만 한 번 재시도한다. 이미지 형식 오류 같은 재시도해도 똑같이 실패할 오류는 바로 포기한다.
     */
    private Optional<Gacha> uploadAndSave(final PlatformPostDto post) {
        for (int attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
            if (attempt > 1) {
                sleepBeforeRetry();
            }
            try {
                return Optional.of(uploadAndSaveOnce(post));
            } catch (S3Exception | DataAccessException e) {
                log.warn("가챠 이미지 업로드/저장 재시도 (미디어 ID: {}, {}/{}번째): {}",
                        post.originalId(), attempt, MAX_UPLOAD_ATTEMPTS, e.getMessage());
            } catch (Exception e) {
                log.error("가챠 이미지 업로드/저장 실패 (미디어 ID: {}): {}", post.originalId(), e.getMessage());
                return Optional.empty();
            }
        }
        log.error("가챠 이미지 업로드/저장 실패 (미디어 ID: {}): 최대 재시도 횟수 초과", post.originalId());
        return Optional.empty();
    }

    private Gacha uploadAndSaveOnce(final PlatformPostDto post) {
        String s3ImageUrl = imageUploader.uploadFromUrl(post.imageUrl(), ImageType.GACHA.buildPath(s3RootFolder));

        Gacha newGacha = Gacha.builder()
                .caption(post.content())
                .thumbnailUrl(s3ImageUrl)
                .instagramMediaId(post.originalId())
                .build();

        return gachaRepository.save(newGacha);
    }

    private void sleepBeforeRetry() {
        try {
            Thread.sleep(UPLOAD_RETRY_DELAY_MS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private boolean isGachaKeywordIncluded(final String caption) {
        return caption.contains("입고") || caption.contains("신상") || caption.contains("재입고");
    }

    private record FilterResult(List<PlatformPostDto> postsToUpload, boolean reachedAlreadyCollected) {
    }

    private record PageResult(List<Gacha> savedGachas, boolean reachedAlreadyCollected) {
    }
}

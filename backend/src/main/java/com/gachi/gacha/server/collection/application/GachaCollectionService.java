package com.gachi.gacha.server.collection.application;

import com.gachi.gacha.server.common.infra.config.ImageType;
import com.gachi.gacha.server.common.infra.config.ImageUploader;
import com.gachi.gacha.server.common.infra.exception.ImageInvalidValueException;
import com.gachi.gacha.server.common.infra.exception.S3Exception;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.server.infrastructure.platform.PlatformClient;
import com.gachi.gacha.server.infrastructure.platform.dto.PlatformPostDto;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GachaCollectionService {

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
            List<PlatformPostDto> posts = platformClient.fetchRecentPosts(shopInstagramId, this::hasAlreadyCollectedPost);
            List<PlatformPostDto> postsToUpload = filterPostsToUpload(posts);
            return uploadAndSaveInParallel(postsToUpload);
        } catch (Exception e) {
            log.error("{} 계정 수집 실패: {}", shopInstagramId, e.getMessage());
            return List.of();
        }
    }

    private boolean hasAlreadyCollectedPost(final List<PlatformPostDto> posts) {
        List<String> mediaIds = posts.stream()
                .map(PlatformPostDto::originalId)
                .toList();
        return !gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(mediaIds).isEmpty();
    }

    /**
     * 게시글 순서대로 dedup 체크와 키워드 필터를 적용해 업로드 대상 목록을 확정한다. 인스타그램 피드가 최신순이라 순서 자체가 "얼마나 예전 게시물인지"를 의미하므로, 이미 수집된 게시글을 만나는 순간
     * 그 이후(더 예전) 게시글은 보지 않는다 - 이 판단은 반드시 순차로 이뤄져야 한다.
     */
    private List<PlatformPostDto> filterPostsToUpload(final List<PlatformPostDto> posts) {
        List<String> mediaIds = posts.stream()
                .map(PlatformPostDto::originalId)
                .toList();
        Set<String> existingMediaIds = new HashSet<>(
                gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(mediaIds));

        return posts.stream()
                .takeWhile(post -> !existingMediaIds.contains(post.originalId()))
                .filter(post -> post.content() != null && GachaKeyword.isIncludedIn(post.content()))
                .toList();
    }

    /**
     * 다운로드/S3 업로드/저장은 순서와 무관하므로 전용 스레드풀에서 병렬로 처리한다. 개별 항목이 실패해도 uploadAndSave 내부에서 스킵되므로, 이 메서드는 성공한 것만 모아 반환한다.
     */
    private List<Gacha> uploadAndSaveInParallel(final List<PlatformPostDto> postsToUpload) {
        List<CompletableFuture<Optional<Gacha>>> futures = postsToUpload.stream()
                .map(post -> CompletableFuture.supplyAsync(() -> uploadAndSave(post), gachaImageUploadExecutor))
                .toList();

        return futures.stream()
                .map(CompletableFuture::join)
                .flatMap(Optional::stream)
                .toList();
    }

    /**
     * 네트워크/DB 일시 장애로 인한 실패만 재시도한다. 이미지 형식 오류 같은, 재시도해도 똑같이 실패할 오류는 바로 포기한다.
     */
    private Optional<Gacha> uploadAndSave(final PlatformPostDto post) {
        for (int attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
            if (attempt > 1) {
                sleepBeforeRetry();
            }
            AttemptResult result = attemptUploadAndSave(post, attempt);
            if (!result.retryable()) {
                return result.gacha();
            }
        }
        log.error("가챠 이미지 업로드/저장 실패 (미디어 ID: {}): 최대 재시도 횟수 초과", post.originalId());
        return Optional.empty();
    }

    /**
     * 업로드/저장 단계를 구분해서 예외를 잡는다. 어느 단계에서 실패했는지에 따라 다른 로그를 남기고,
     * 재시도 가능한 실패인지를 함께 반환한다.
     */
    private AttemptResult attemptUploadAndSave(final PlatformPostDto post, final int attempt) {
        try {
            String s3ImageUrl = uploadImage(post);
            return new AttemptResult(Optional.of(saveGacha(post, s3ImageUrl)), false);
        } catch (ImageInvalidValueException e) {
            log.error("가챠 이미지 업로드 실패 (미디어 ID: {}): {}", post.originalId(), e.getMessage());
            return new AttemptResult(Optional.empty(), false);
        } catch (S3Exception e) {
            log.warn("가챠 이미지 업로드 재시도 (미디어 ID: {}, {}/{}번째): {}",
                    post.originalId(), attempt, MAX_UPLOAD_ATTEMPTS, e.getMessage());
            return new AttemptResult(Optional.empty(), true);
        } catch (DataAccessException e) {
            log.warn("가챠 저장 재시도 (미디어 ID: {}, {}/{}번째): {}",
                    post.originalId(), attempt, MAX_UPLOAD_ATTEMPTS, e.getMessage());
            return new AttemptResult(Optional.empty(), true);
        } catch (Exception e) {
            log.error("가챠 이미지 업로드/저장 실패 (미디어 ID: {}): {}", post.originalId(), e.getMessage());
            return new AttemptResult(Optional.empty(), false);
        }
    }

    private record AttemptResult(Optional<Gacha> gacha, boolean retryable) {
    }

    private String uploadImage(final PlatformPostDto post) {
        return imageUploader.uploadFromUrl(post.imageUrl(), ImageType.GACHA.buildPath(s3RootFolder));
    }

    private Gacha saveGacha(final PlatformPostDto post, final String s3ImageUrl) {
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
}

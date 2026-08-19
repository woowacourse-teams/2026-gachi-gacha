package com.gachi.gacha.server.collection.application;

import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.server.infrastructure.platform.PlatformClient;
import com.gachi.gacha.server.infrastructure.platform.dto.PlatformPostDto;
import com.gachi.gacha.server.infrastructure.platform.dto.PlatformPostPage;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GachaBatchService {

    private static final int MAX_PAGES_PER_SHOP = 5;

    private final List<PlatformClient> platformClients;
    private final GachaJpaRepository gachaRepository;

    public List<Gacha> collectPostsForShop(final String shopInstagramId) {
        List<Gacha> savedGachas = new ArrayList<>();

        for (PlatformClient platformClient : platformClients) {
            try {
                savedGachas.addAll(collectFromPlatform(platformClient, shopInstagramId));
            } catch (Exception e) {
                log.error("{} 계정 수집 실패: {}", shopInstagramId, e.getMessage());
            }
        }

        return savedGachas;
    }

    private List<Gacha> collectFromPlatform(final PlatformClient platformClient, final String shopInstagramId) {
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
        List<Gacha> gachas = new ArrayList<>();

        for (PlatformPostDto post : posts) {
            if (gachaRepository.existsByInstagramMediaId(post.originalId())) {
                return new PageResult(gachas, true);
            }

            if (post.content() == null || !isGachaKeywordIncluded(post.content())) {
                continue;
            }

            try {
                Gacha newGacha = Gacha.builder()
                        .name("임시이름_수동검수필요")
                        .caption(post.content())
                        .thumbnailUrl(post.imageUrl())
                        .instagramMediaId(post.originalId())
                        .build();

                gachas.add(gachaRepository.save(newGacha));
            } catch (Exception e) {
                log.error("가챠 데이터 저장 실패 (미디어 ID: {}): {}", post.originalId(), e.getMessage());
            }
        }
        return new PageResult(gachas, false);
    }

    private boolean isGachaKeywordIncluded(String caption) {
        return caption.contains("입고") || caption.contains("신상") || caption.contains("재입고");
    }

    private record PageResult(List<Gacha> savedGachas, boolean reachedAlreadyCollected) {
    }
}

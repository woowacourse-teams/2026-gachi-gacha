package com.gachi.gacha.server.collection.infra.instagram;

import com.gachi.gacha.server.collection.infra.instagram.dto.InstagramResponse;
import com.gachi.gacha.server.collection.infra.instagram.dto.InstagramResponse.MediaData;
import com.gachi.gacha.server.collection.infra.platform.PlatformClient;
import com.gachi.gacha.server.collection.infra.platform.PlatformType;
import com.gachi.gacha.server.collection.infra.platform.dto.PlatformPostDto;
import com.gachi.gacha.server.collection.infra.platform.dto.PlatformPostPage;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Predicate;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Component
public class InstagramClient implements PlatformClient {

    private static final int MAX_PAGES_PER_ACCOUNT = 5;

    private final RestTemplate restTemplate;
    private final String uri;
    private final String userId;
    private final String accessToken;

    public InstagramClient(
            final RestTemplate restTemplate,
            @Value("${instagram.api.uri}") final String uri,
            @Value("${instagram.api.user-id}") final String userId,
            @Value("${instagram.api.access-token}") final String accessToken
    ) {
        this.restTemplate = restTemplate;
        this.uri = uri;
        this.userId = userId;
        this.accessToken = accessToken;
    }

    @Override
    public List<PlatformPostDto> fetchRecentPosts(
            final String targetUsername, final Predicate<List<PlatformPostDto>> shouldStopAfterPage) {
        List<PlatformPostDto> allPosts = new ArrayList<>();
        String cursor = null;

        for (int page = 1; page <= MAX_PAGES_PER_ACCOUNT; page++) {
            PlatformPostPage postPage = fetchPage(targetUsername, cursor);
            allPosts.addAll(postPage.posts());

            if (shouldStopAfterPage.test(postPage.posts()) || !postPage.hasNext()) {
                return allPosts;
            }
            if (page == MAX_PAGES_PER_ACCOUNT) {
                log.warn("{}: 페이지 상한({}) 도달, 이전 게시물이 더 남아있을 수 있음", targetUsername, MAX_PAGES_PER_ACCOUNT);
                return allPosts;
            }
            cursor = postPage.nextCursor();
        }

        return allPosts;
    }

    private PlatformPostPage fetchPage(final String targetUsername, @Nullable final String cursor) {
        String mediaField = cursor == null ? "media.limit(10)" : "media.limit(10).after(" + cursor + ")";
        String fields = String.format(
                "business_discovery.username(%s){%s{id,caption,media_type,media_url,thumbnail_url,"
                        + "children{id,media_type,media_url,thumbnail_url}}}",
                targetUsername, mediaField);

        URI requestUri = UriComponentsBuilder.fromUriString(uri + "/" + userId)
                .queryParam("fields", fields)
                .queryParam("access_token", accessToken)
                .build()
                .encode()
                .toUri();

        InstagramResponse response = restTemplate.getForObject(requestUri, InstagramResponse.class);

        if (response == null || response.businessDiscovery() == null || response.businessDiscovery().media() == null) {
            return new PlatformPostPage(List.of(), null);
        }

        InstagramResponse.Media media = response.businessDiscovery().media();
        List<PlatformPostDto> posts = media.data().stream()
                .flatMap(data -> toPlatformPosts(data).stream())
                .toList();

        return new PlatformPostPage(posts, media.nextCursor());
    }

    private List<PlatformPostDto> toPlatformPosts(final MediaData data) {
        if (data.isCarouselWithChildren()) {
            return data.children().data().stream()
                    .map(child -> new PlatformPostDto(
                            child.id(),
                            data.caption(),
                            child.getDisplayUrl(),
                            PlatformType.INSTAGRAM
                    ))
                    .toList();
        }

        return List.of(new PlatformPostDto(
                data.id(),
                data.caption(),
                data.getDisplayUrl(),
                PlatformType.INSTAGRAM
        ));
    }

    @Override
    public PlatformType getPlatformType() {
        return PlatformType.INSTAGRAM;
    }
}

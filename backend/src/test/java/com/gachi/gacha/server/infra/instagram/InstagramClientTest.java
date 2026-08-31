package com.gachi.gacha.server.infra.instagram;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gachi.gacha.server.collection.infra.instagram.InstagramClient;
import com.gachi.gacha.server.collection.infra.instagram.dto.InstagramResponse;
import com.gachi.gacha.server.collection.infra.instagram.dto.InstagramResponse.BusinessDiscovery;
import com.gachi.gacha.server.collection.infra.instagram.dto.InstagramResponse.Cursors;
import com.gachi.gacha.server.collection.infra.instagram.dto.InstagramResponse.Media;
import com.gachi.gacha.server.collection.infra.instagram.dto.InstagramResponse.MediaData;
import com.gachi.gacha.server.collection.infra.instagram.dto.InstagramResponse.Paging;
import com.gachi.gacha.server.collection.infra.platform.PlatformType;
import com.gachi.gacha.server.collection.infra.platform.dto.PlatformPostDto;
import java.net.URI;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
class InstagramClientTest {

    @Mock
    private RestTemplate restTemplate;

    private InstagramClient client() {
        return new InstagramClient(restTemplate, "https://graph.facebook.com/v26.0", "dummy-user-id",
                "dummy-access-token");
    }

    @Test
    @DisplayName("응답의 미디어 목록을 PlatformPostDto로 변환하며, thumbnailUrl이 있으면 우선 사용한다.")
    void fetchRecentPosts_mapsMediaToPlatformPostDto() {
        // given
        InstagramResponse response = new InstagramResponse(
                new BusinessDiscovery(new Media(List.of(
                        new MediaData("media-1", "입고 안내", "https://cdn/media.jpg", "https://cdn/thumb.jpg", "IMAGE",
                                null)
                ), null))
        );
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class))).thenReturn(response);

        // when
        List<PlatformPostDto> result = client().fetchRecentPosts("hoshi__gacha", posts -> true);

        // then
        assertThat(result).hasSize(1);
        PlatformPostDto post = result.get(0);
        assertThat(post.originalId()).isEqualTo("media-1");
        assertThat(post.content()).isEqualTo("입고 안내");
        assertThat(post.imageUrl()).isEqualTo("https://cdn/thumb.jpg");
        assertThat(post.platformType()).isEqualTo(PlatformType.INSTAGRAM);
        verify(restTemplate, times(1)).getForObject(any(URI.class), eq(InstagramResponse.class));
    }

    @Test
    @DisplayName("thumbnailUrl이 없으면 media_url로 대체한다.")
    void fetchRecentPosts_fallsBackToMediaUrl_whenThumbnailMissing() {
        // given
        InstagramResponse response = new InstagramResponse(
                new BusinessDiscovery(new Media(List.of(
                        new MediaData("media-2", "신상 입고", "https://cdn/media.jpg", null, "IMAGE", null)
                ), null))
        );
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class))).thenReturn(response);

        // when
        List<PlatformPostDto> result = client().fetchRecentPosts("hoshi__gacha", posts -> true);

        // then
        assertThat(result.get(0).imageUrl()).isEqualTo("https://cdn/media.jpg");
    }

    @Test
    @DisplayName("캐러셀 게시물은 각 자식 이미지를 별도의 PlatformPostDto로 변환하며, 캡션은 부모 게시물의 것을 사용한다.")
    void fetchRecentPosts_expandsCarouselChildrenIntoSeparatePosts() {
        // given
        InstagramResponse.Children children = new InstagramResponse.Children(List.of(
                new InstagramResponse.ChildMedia("child-1", "IMAGE", "https://cdn/child1.jpg", null),
                new InstagramResponse.ChildMedia("child-2", "IMAGE", "https://cdn/child2.jpg",
                        "https://cdn/child2-thumb.jpg")
        ));
        InstagramResponse response = new InstagramResponse(
                new BusinessDiscovery(new Media(List.of(
                        new MediaData("carousel-1", "입고 안내 모음", "https://cdn/cover.jpg", null, "CAROUSEL_ALBUM",
                                children)
                ), null))
        );
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class))).thenReturn(response);

        // when
        List<PlatformPostDto> result = client().fetchRecentPosts("hoshi__gacha", posts -> true);

        // then
        assertThat(result).hasSize(2);
        assertThat(result).extracting(PlatformPostDto::originalId).containsExactly("child-1", "child-2");
        assertThat(result).extracting(PlatformPostDto::content).containsOnly("입고 안내 모음");
        assertThat(result).extracting(PlatformPostDto::imageUrl)
                .containsExactly("https://cdn/child1.jpg", "https://cdn/child2-thumb.jpg");
    }

    @Test
    @DisplayName("자식 이미지가 없는 캐러셀 게시물은 부모 게시물 자체를 하나의 PlatformPostDto로 변환한다.")
    void fetchRecentPosts_carouselWithoutChildren_fallsBackToParentPost() {
        // given
        InstagramResponse response = new InstagramResponse(
                new BusinessDiscovery(new Media(List.of(
                        new MediaData("carousel-2", "입고 안내", "https://cdn/cover.jpg", null, "CAROUSEL_ALBUM",
                                new InstagramResponse.Children(List.of()))
                ), null))
        );
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class))).thenReturn(response);

        // when
        List<PlatformPostDto> result = client().fetchRecentPosts("hoshi__gacha", posts -> true);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).originalId()).isEqualTo("carousel-2");
    }

    @Test
    @DisplayName("응답의 paging.cursors.after 값을 다음 요청의 커서로 사용한다.")
    void fetchRecentPosts_usesNextCursorFromPagingInNextRequest() {
        // given
        InstagramResponse page1 = new InstagramResponse(new BusinessDiscovery(new Media(
                List.of(new MediaData("media-1", "입고 안내", "https://cdn/media.jpg", null, "IMAGE", null)),
                new Paging(new Cursors("next-cursor-value"))
        )));
        InstagramResponse page2 = new InstagramResponse(new BusinessDiscovery(new Media(List.of(), null)));
        ArgumentCaptor<URI> uriCaptor = ArgumentCaptor.forClass(URI.class);
        when(restTemplate.getForObject(uriCaptor.capture(), eq(InstagramResponse.class)))
                .thenReturn(page1)
                .thenReturn(page2);

        // when
        client().fetchRecentPosts("hoshi__gacha", posts -> false);

        // then
        assertThat(uriCaptor.getAllValues()).hasSize(2);
        assertThat(uriCaptor.getAllValues().get(1).toString()).contains("next-cursor-value");
    }

    @Test
    @DisplayName("응답이 null이면 빈 목록을 반환한다.")
    void fetchRecentPosts_nullResponse_returnsEmptyList() {
        // given
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class))).thenReturn(null);

        // when
        List<PlatformPostDto> result = client().fetchRecentPosts("hoshi__gacha", posts -> true);

        // then
        assertThat(result).isEmpty();
        verify(restTemplate, times(1)).getForObject(any(URI.class), eq(InstagramResponse.class));
    }

    @Test
    @DisplayName("business_discovery가 null이면 빈 목록을 반환한다.")
    void fetchRecentPosts_nullBusinessDiscovery_returnsEmptyList() {
        // given
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class)))
                .thenReturn(new InstagramResponse(null));

        // when
        List<PlatformPostDto> result = client().fetchRecentPosts("hoshi__gacha", posts -> true);

        // then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("media가 null이면 빈 목록을 반환한다.")
    void fetchRecentPosts_nullMedia_returnsEmptyList() {
        // given
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class)))
                .thenReturn(new InstagramResponse(new BusinessDiscovery(null)));

        // when
        List<PlatformPostDto> result = client().fetchRecentPosts("hoshi__gacha", posts -> true);

        // then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("shouldStopAfterPage가 true를 반환하는 페이지까지만 가져오고 멈춘다.")
    void fetchRecentPosts_stopsWhenShouldStopReturnsTrue() {
        // given
        InstagramResponse page1 = new InstagramResponse(new BusinessDiscovery(new Media(
                List.of(new MediaData("media-1", "입고 안내", "url1", null, "IMAGE", null)),
                new Paging(new Cursors("cursor-1"))
        )));
        InstagramResponse page2 = new InstagramResponse(new BusinessDiscovery(new Media(
                List.of(new MediaData("media-0", "예전 글", "url0", null, "IMAGE", null)),
                new Paging(new Cursors("cursor-2"))
        )));
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class)))
                .thenReturn(page1)
                .thenReturn(page2);

        // when
        List<PlatformPostDto> result = client().fetchRecentPosts("hoshi__gacha",
                posts -> posts.stream().anyMatch(post -> post.originalId().equals("media-0")));

        // then
        assertThat(result).extracting(PlatformPostDto::originalId).containsExactly("media-1", "media-0");
        verify(restTemplate, times(2)).getForObject(any(URI.class), eq(InstagramResponse.class));
    }

    @Test
    @DisplayName("다음 커서가 없으면 더 요청하지 않는다.")
    void fetchRecentPosts_stopsWhenNoNextCursor() {
        // given
        InstagramResponse onlyPage = new InstagramResponse(new BusinessDiscovery(new Media(
                List.of(new MediaData("media-1", "입고 안내", "url1", null, "IMAGE", null)),
                null
        )));
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class))).thenReturn(onlyPage);

        // when
        List<PlatformPostDto> result = client().fetchRecentPosts("hoshi__gacha", posts -> false);

        // then
        assertThat(result).hasSize(1);
        verify(restTemplate, times(1)).getForObject(any(URI.class), eq(InstagramResponse.class));
    }

    @Test
    @DisplayName("shouldStopAfterPage가 계속 false여도 안전 상한 페이지 수까지만 요청한다.")
    void fetchRecentPosts_stopsAtSafetyPageLimit() {
        // given: 매 페이지가 전부 신규이며 다음 커서가 항상 존재하는 상황(무한 백로그)
        InstagramResponse pageWithNext = new InstagramResponse(new BusinessDiscovery(new Media(
                List.of(new MediaData("media-x", "입고 안내", "url", null, "IMAGE", null)),
                new Paging(new Cursors("next-cursor"))
        )));
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class))).thenReturn(pageWithNext);

        // when
        List<PlatformPostDto> result = client().fetchRecentPosts("hoshi__gacha", posts -> false);

        // then
        assertThat(result).hasSize(5);
        verify(restTemplate, times(5)).getForObject(any(URI.class), eq(InstagramResponse.class));
    }
}

package com.gachi.gacha.server.infrastructure.instagram;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.gachi.gacha.server.infrastructure.instagram.dto.InstagramResponse;
import com.gachi.gacha.server.infrastructure.instagram.dto.InstagramResponse.BusinessDiscovery;
import com.gachi.gacha.server.infrastructure.instagram.dto.InstagramResponse.Cursors;
import com.gachi.gacha.server.infrastructure.instagram.dto.InstagramResponse.Media;
import com.gachi.gacha.server.infrastructure.instagram.dto.InstagramResponse.MediaData;
import com.gachi.gacha.server.infrastructure.instagram.dto.InstagramResponse.Paging;
import com.gachi.gacha.server.infrastructure.platform.PlatformType;
import com.gachi.gacha.server.infrastructure.platform.dto.PlatformPostDto;
import com.gachi.gacha.server.infrastructure.platform.dto.PlatformPostPage;
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
                        new MediaData("media-1", "입고 안내", "https://cdn/media.jpg", "https://cdn/thumb.jpg", "IMAGE", null)
                ), null))
        );
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class))).thenReturn(response);

        // when
        PlatformPostPage result = client().fetchRecentPosts("hoshi__gacha", null);

        // then
        assertThat(result.posts()).hasSize(1);
        PlatformPostDto post = result.posts().get(0);
        assertThat(post.originalId()).isEqualTo("media-1");
        assertThat(post.content()).isEqualTo("입고 안내");
        assertThat(post.imageUrl()).isEqualTo("https://cdn/thumb.jpg");
        assertThat(post.platformType()).isEqualTo(PlatformType.INSTAGRAM);
        assertThat(result.hasNext()).isFalse();
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
        PlatformPostPage result = client().fetchRecentPosts("hoshi__gacha", null);

        // then
        assertThat(result.posts().get(0).imageUrl()).isEqualTo("https://cdn/media.jpg");
    }

    @Test
    @DisplayName("캐러셀 게시물은 각 자식 이미지를 별도의 PlatformPostDto로 변환하며, 캡션은 부모 게시물의 것을 사용한다.")
    void fetchRecentPosts_expandsCarouselChildrenIntoSeparatePosts() {
        // given
        InstagramResponse.Children children = new InstagramResponse.Children(List.of(
                new InstagramResponse.ChildMedia("child-1", "IMAGE", "https://cdn/child1.jpg", null),
                new InstagramResponse.ChildMedia("child-2", "IMAGE", "https://cdn/child2.jpg", "https://cdn/child2-thumb.jpg")
        ));
        InstagramResponse response = new InstagramResponse(
                new BusinessDiscovery(new Media(List.of(
                        new MediaData("carousel-1", "입고 안내 모음", "https://cdn/cover.jpg", null, "CAROUSEL_ALBUM", children)
                ), null))
        );
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class))).thenReturn(response);

        // when
        PlatformPostPage result = client().fetchRecentPosts("hoshi__gacha", null);

        // then
        assertThat(result.posts()).hasSize(2);
        assertThat(result.posts()).extracting(PlatformPostDto::originalId).containsExactly("child-1", "child-2");
        assertThat(result.posts()).extracting(PlatformPostDto::content).containsOnly("입고 안내 모음");
        assertThat(result.posts()).extracting(PlatformPostDto::imageUrl)
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
        PlatformPostPage result = client().fetchRecentPosts("hoshi__gacha", null);

        // then
        assertThat(result.posts()).hasSize(1);
        assertThat(result.posts().get(0).originalId()).isEqualTo("carousel-2");
    }

    @Test
    @DisplayName("응답의 paging.cursors.after 값을 다음 커서로 반환한다.")
    void fetchRecentPosts_returnsNextCursorFromPaging() {
        // given
        InstagramResponse response = new InstagramResponse(
                new BusinessDiscovery(new Media(
                        List.of(new MediaData("media-1", "입고 안내", "https://cdn/media.jpg", null, "IMAGE", null)),
                        new Paging(new Cursors("next-cursor-value"))
                ))
        );
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class))).thenReturn(response);

        // when
        PlatformPostPage result = client().fetchRecentPosts("hoshi__gacha", null);

        // then
        assertThat(result.hasNext()).isTrue();
        assertThat(result.nextCursor()).isEqualTo("next-cursor-value");
    }

    @Test
    @DisplayName("cursor가 주어지면 요청 URI에 after() 파라미터로 포함시킨다.")
    void fetchRecentPosts_includesCursorInRequestUri() {
        // given
        ArgumentCaptor<URI> uriCaptor = ArgumentCaptor.forClass(URI.class);
        when(restTemplate.getForObject(uriCaptor.capture(), eq(InstagramResponse.class)))
                .thenReturn(new InstagramResponse(new BusinessDiscovery(new Media(List.of(), null))));

        // when
        client().fetchRecentPosts("hoshi__gacha", "some-cursor");

        // then
        assertThat(uriCaptor.getValue().toString()).contains("some-cursor");
    }

    @Test
    @DisplayName("응답이 null이면 빈 목록을 반환한다.")
    void fetchRecentPosts_nullResponse_returnsEmptyList() {
        // given
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class))).thenReturn(null);

        // when
        PlatformPostPage result = client().fetchRecentPosts("hoshi__gacha", null);

        // then
        assertThat(result.posts()).isEmpty();
        assertThat(result.hasNext()).isFalse();
    }

    @Test
    @DisplayName("business_discovery가 null이면 빈 목록을 반환한다.")
    void fetchRecentPosts_nullBusinessDiscovery_returnsEmptyList() {
        // given
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class)))
                .thenReturn(new InstagramResponse(null));

        // when
        PlatformPostPage result = client().fetchRecentPosts("hoshi__gacha", null);

        // then
        assertThat(result.posts()).isEmpty();
    }

    @Test
    @DisplayName("media가 null이면 빈 목록을 반환한다.")
    void fetchRecentPosts_nullMedia_returnsEmptyList() {
        // given
        when(restTemplate.getForObject(any(URI.class), eq(InstagramResponse.class)))
                .thenReturn(new InstagramResponse(new BusinessDiscovery(null)));

        // when
        PlatformPostPage result = client().fetchRecentPosts("hoshi__gacha", null);

        // then
        assertThat(result.posts()).isEmpty();
    }
}

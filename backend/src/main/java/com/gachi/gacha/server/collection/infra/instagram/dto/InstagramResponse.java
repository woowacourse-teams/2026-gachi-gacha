package com.gachi.gacha.server.collection.infra.instagram.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record InstagramResponse(
        @JsonProperty("business_discovery") BusinessDiscovery businessDiscovery
) {
    public record BusinessDiscovery(
            Media media
    ) {
    }

    public record Media(
            List<MediaData> data,
            Paging paging
    ) {
        public String nextCursor() {
            if (paging == null || paging.cursors() == null) {
                return null;
            }
            return paging.cursors().after();
        }
    }

    public record Paging(
            Cursors cursors
    ) {
    }

    public record Cursors(
            String after
    ) {
    }

    public record MediaData(
            String id,
            String caption,
            @JsonProperty("media_url") String mediaUrl,
            @JsonProperty("thumbnail_url") String thumbnailUrl,
            @JsonProperty("media_type") String mediaType,
            Children children
    ) {
        private static final String CAROUSEL_ALBUM = "CAROUSEL_ALBUM";

        public String getDisplayUrl() {
            return thumbnailUrl != null ? thumbnailUrl : mediaUrl;
        }

        public boolean isCarouselWithChildren() {
            return CAROUSEL_ALBUM.equals(mediaType)
                    && children != null
                    && children.data() != null
                    && !children.data().isEmpty();
        }
    }

    public record Children(
            List<ChildMedia> data
    ) {
    }

    public record ChildMedia(
            String id,
            @JsonProperty("media_type") String mediaType,
            @JsonProperty("media_url") String mediaUrl,
            @JsonProperty("thumbnail_url") String thumbnailUrl
    ) {
        public String getDisplayUrl() {
            return thumbnailUrl != null ? thumbnailUrl : mediaUrl;
        }
    }
}

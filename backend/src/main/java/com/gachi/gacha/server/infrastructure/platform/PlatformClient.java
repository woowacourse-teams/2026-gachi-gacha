package com.gachi.gacha.server.infrastructure.platform;

import com.gachi.gacha.server.infrastructure.platform.dto.PlatformPostPage;
import org.jspecify.annotations.Nullable;

public interface PlatformClient {
    PlatformPostPage fetchRecentPosts(String targetId, @Nullable String cursor);

    PlatformType getPlatformType();
}

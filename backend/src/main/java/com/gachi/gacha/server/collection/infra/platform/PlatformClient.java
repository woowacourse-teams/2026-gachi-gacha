package com.gachi.gacha.server.collection.infra.platform;

import com.gachi.gacha.server.collection.infra.platform.dto.PlatformPostDto;
import java.util.List;
import java.util.function.Predicate;

public interface PlatformClient {

    /**
     * 대상 계정의 최근 게시글을 가져온다. 페이지네이션(커서 추적, 페이지 상한 등)은 각 플랫폼 구현체가 알아서 처리하고, shouldStopAfterPage가 어떤 페이지에 대해 true를 반환하면 그
     * 페이지까지만 가져오고 중단한다.
     */
    List<PlatformPostDto> fetchRecentPosts(String targetId, Predicate<List<PlatformPostDto>> shouldStopAfterPage);

    PlatformType getPlatformType();
}

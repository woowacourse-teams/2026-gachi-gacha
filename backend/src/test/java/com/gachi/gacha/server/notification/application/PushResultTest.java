package com.gachi.gacha.server.notification.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PushResultTest {

    @Test
    @DisplayName("두 결과를 더하면 수와 무효 토큰이 모두 합쳐진다")
    void plusMergesCountsAndInvalidTokens() {
        PushResult merged = new PushResult(3, 1, 0, List.of("a")).plus(new PushResult(2, 0, 4, List.of("b", "c")));

        assertThat(merged).isEqualTo(new PushResult(5, 1, 4, List.of("a", "b", "c")));
    }

    @Test
    @DisplayName("아무것도 보내지 않은 결과를 더해도 그대로다")
    void noneIsIdentity() {
        PushResult result = new PushResult(1, 2, 3, List.of("a"));

        assertThat(result.plus(PushResult.NONE)).isEqualTo(result);
        assertThat(PushResult.NONE.plus(result)).isEqualTo(result);
    }

    @Test
    @DisplayName("무효 토큰 목록은 복사해서 들고 있어 밖에서 바꿔도 영향이 없다")
    void copiesInvalidTokens() {
        List<String> invalid = new ArrayList<>(List.of("a"));
        PushResult result = new PushResult(0, 1, 0, invalid);

        invalid.add("b");

        assertThat(result.invalidTokens()).containsExactly("a");
    }
}

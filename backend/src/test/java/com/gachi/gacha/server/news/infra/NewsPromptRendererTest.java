package com.gachi.gacha.server.news.infra;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsSection;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 치이카와 프롬프트(chiikawa-v2)가 서버가 읽는 값과 같은 계약을 쓰는지 확인한다.
 * 스크립트의 프롬프트와는 kind·location·null 규칙이 달라서 글자까지 비교하지 않는다.
 */
class NewsPromptRendererTest {

    private static final String PROMPT_DIR = "news/prompts/chiikawa";

    private final NewsPromptRenderer renderer = new NewsPromptRenderer();

    @Test
    @DisplayName("변수를 모두 채우고, 앞뒤 공백을 지우며, 남은 {{변수}} 가 없다")
    void rendersAllVariables() {
        String system = renderer.system(PROMPT_DIR, variables());
        String user = renderer.user(PROMPT_DIR, variables());

        assertThat(system).startsWith("당신은 치이카와(ちいかわ) 관련 공식 굿즈");
        assertThat(user).startsWith("오늘 날짜: 2026-11-12 (한국 시간)")
                .contains("검색 기간: 2026-11-09 ~ 2026-11-11 직전")
                .contains("@chiikawashop_kr 계정")
                .contains("검색어: from:chiikawashop_kr");
        assertThat(system + user).doesNotContain("{{");
    }

    @Test
    @DisplayName("프롬프트가 안내하는 section·kind 값은 서버가 허용하는 값과 같다")
    void promptValuesMatchServerEnums() {
        String system = renderer.system(PROMPT_DIR, variables());

        Arrays.stream(NewsSection.values()).forEach(section -> assertThat(system).contains(section.getValue()));
        Arrays.stream(NewsKind.values()).forEach(kind -> assertThat(system).contains(kind.getValue()));
        assertThat(system).contains("release | restock | preorder | entry_reservation | popup | lottery | notice | other")
                .contains("모르는 값은 반드시 null로 둔다");
    }

    @Test
    @DisplayName("IP 이름은 변수로 채운다")
    void fillsIpName() {
        Map<String, String> variables = variables();
        variables.put("ipName", "농담곰");
        variables.put("ipNameJa", "ナガノのくま");

        assertThat(renderer.system(PROMPT_DIR, variables)).startsWith("당신은 농담곰(ナガノのくま) 관련 공식 굿즈");
        assertThat(renderer.user(PROMPT_DIR, variables)).contains("게시물에서 농담곰 공식 굿즈");
    }

    @Test
    @DisplayName("값이 없는 변수가 있거나 파일이 없으면 실패하고, 값의 $ 와 \\ 는 그대로 넣는다")
    void failuresAndLiteralValues() {
        Map<String, String> missing = variables();
        missing.remove("handle");
        Map<String, String> special = variables();
        special.put("query", "from:a $1 \\n");

        assertThatThrownBy(() -> renderer.user(PROMPT_DIR, missing))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("handle");
        assertThatThrownBy(() -> renderer.system("news/prompts/unknown", variables()))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("news/prompts/unknown/system.txt");
        assertThat(renderer.user(PROMPT_DIR, special)).contains("검색어: from:a $1 \\n");
    }

    private Map<String, String> variables() {
        Map<String, String> variables = new HashMap<>();
        variables.put("ipName", "치이카와");
        variables.put("ipNameJa", "ちいかわ");
        variables.put("todayKst", "2026-11-12");
        variables.put("from", "2026-11-09");
        variables.put("toLabel", "2026-11-11 직전");
        variables.put("handle", "chiikawashop_kr");
        variables.put("query", "from:chiikawashop_kr");
        return variables;
    }
}

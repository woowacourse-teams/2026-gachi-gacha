package com.gachi.gacha.server.news.domain;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

/**
 * news 테이블의 JSONB 컬럼 값을 읽고 쓴다.
 *
 * <p>Hibernate 에 JSON 변환을 맡기면 클래스패스의 Jackson 2·3 중 무엇을 쓰느냐에 따라 날짜 표기가 달라질 수 있다.
 * 그래서 엔티티는 JSON 문자열을 그대로 들고, 변환은 이 클래스 한 곳에서 한다. 날짜는 항상 YYYY-MM-DD 문자열이다.
 */
final class NewsJsonCodec {

    /**
     * Jackson 3 는 없는 숫자·불리언 필드를 기본적으로 오류로 본다. 필드가 추가되기 전에 저장한 값도 읽을 수 있도록 기본값으로 읽는다.
     */
    private static final ObjectMapper MAPPER = JsonMapper.builder()
            .disable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES)
            .build();
    private static final TypeReference<Map<String, PeriodJson>> PERIODS = new TypeReference<>() {
    };

    private NewsJsonCodec() {
    }

    /**
     * 계정 아이디를 키로 둔다. 예: {"chiikawa_market": {"from": "2026-11-05", "to": "2026-11-12", "collected": true}}
     */
    static String writePeriods(final List<CollectPeriod> periods) {
        Map<String, PeriodJson> json = new LinkedHashMap<>();
        periods.forEach(period -> json.put(period.handle(),
                new PeriodJson(period.from().toString(), period.to().toString(), period.collected())));
        return MAPPER.writeValueAsString(json);
    }

    static List<CollectPeriod> readPeriods(final String json) {
        List<CollectPeriod> periods = new ArrayList<>();
        MAPPER.readValue(json, PERIODS).forEach((handle, period) -> periods.add(new CollectPeriod(
                handle, LocalDate.parse(period.from()), LocalDate.parse(period.to()), period.collected())));
        return periods;
    }

    static String writeDetail(final NewsDetail detail) {
        return MAPPER.writeValueAsString(detail);
    }

    static NewsDetail readDetail(final String json) {
        return MAPPER.readValue(json, NewsDetail.class);
    }

    static String writeUsage(final GrokUsage usage) {
        return MAPPER.writeValueAsString(usage);
    }

    static GrokUsage readUsage(final String json) {
        GrokUsage usage = MAPPER.readValue(json, GrokUsage.class);
        return usage == null ? GrokUsage.NONE : usage;
    }

    private record PeriodJson(String from, String to, boolean collected) {
    }
}

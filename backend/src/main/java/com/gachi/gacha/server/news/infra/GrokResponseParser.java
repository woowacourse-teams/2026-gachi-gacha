package com.gachi.gacha.server.news.infra;

import com.gachi.gacha.server.news.domain.CollectedNews;
import com.gachi.gacha.server.news.domain.GrokUsage;
import com.gachi.gacha.server.news.domain.NewsDetail;
import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsLink;
import com.gachi.gacha.server.news.domain.NewsSection;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Pattern;
import org.jspecify.annotations.Nullable;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * xAI Responses API 응답에서 소식과 사용량을 꺼낸다. 해석 규칙은 수집 스크립트의 process_res 와 같다.
 *
 * <ul>
 *   <li>응답이 JSON 이 아니거나 error 가 오면 호출 실패다. 회차 전체를 실패로 처리한다</li>
 *   <li>모델이 쓴 본문(output_text)을 해석하지 못하면 경고만 남긴다</li>
 *   <li>링크 검증: 응답에 실제로 나온 URL(citations 와 응답 어디든 있는 url 필드)을 정규화해 모으고, 소식의 link 가
 *       그 안에 있는지 본다. 모은 URL 이 없거나 link 가 비어 있으면 판단을 보류한다(null)</li>
 * </ul>
 *
 * <p>형식 검사도 여기서 한다. section 이나 kind 가 허용 값이 아니거나 제목이 없으면 그 소식만 버리고
 * 이유를 남긴다. 스크립트는 허용되지 않은 section 을 other_goods 로 바꾸지만 서버는 버린다.
 * 날짜는 YYYY-MM-DD 이면서 실제로 있는 날짜일 때만 읽는다.
 * 모델이 필드 타입을 틀리게 보내도 응답 전체를 버리지 않도록, 문자열이어야 할 값이 아니면 비어 있는 것으로 읽는다.
 */
public class GrokResponseParser {

    private static final int SEARCH_LIMIT = 10;
    private static final int ERROR_PREVIEW_LENGTH = 300;
    private static final Pattern LEADING_FENCE = Pattern.compile("^\\s*```[a-zA-Z]*\\s*");
    private static final Pattern TRAILING_FENCE = Pattern.compile("\\s*```\\s*$");
    private static final Pattern ISO_DATE = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");
    private static final Set<String> UNKNOWN_WORDS = Set.of("미정", "null", "none", "n/a", "unknown", "tbd", "-");

    private final ObjectMapper objectMapper;

    public GrokResponseParser(final ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * @param account 이 호출이 검색한 X 계정. 소식의 출처 계정은 모델이 아니라 이 값으로 정한다
     */
    public Result parse(final String label, final String account, final String responseBody) {
        JsonNode response = readJson(responseBody);
        if (response == null) {
            return new Result.Failure("[" + label + "] 응답이 JSON이 아님");
        }
        JsonNode error = response.path("error");
        if (!error.isMissingNode() && !error.isNull() && !(error.isBoolean() && !error.booleanValue())) {
            return new Result.Failure("[" + label + "] 에러: " + preview(error));
        }

        GrokUsage usage = GrokUsage.of(response);
        List<String> warnings = new ArrayList<>();
        if (usage.postsFetched() >= SEARCH_LIMIT) {
            warnings.add("[" + label + "] 게시물 " + usage.postsFetched()
                    + "건 — 검색 상한(10건)에 걸려 잘렸을 수 있음. 분할 일수를 줄일 것");
        }

        Set<String> citedUrls = collectCitedUrls(response);
        JsonNode content = readJson(stripCodeFence(outputText(response)));
        if (content == null || !content.path("items").isArray()) {
            warnings.add("[" + label + "] JSON 파싱 실패");
            return new Result.Success(usage, List.of(), List.of(), 0, warnings);
        }

        List<CollectedNews> items = new ArrayList<>();
        List<Discarded> discarded = new ArrayList<>();
        for (JsonNode item : content.path("items")) {
            if (!item.isObject()) {
                continue;
            }
            String link = text(item, "link");
            Boolean verified = (citedUrls.isEmpty() || link == null || link.isEmpty())
                    ? null
                    : citedUrls.contains(NewsLink.normalize(link));
            toNews(item, account, link, verified).ifPresentOrElse(items::add, () ->
                    discarded.add(new Discarded(text(item, "title"), link, rejectionReason(item))));
        }
        JsonNode skipped = content.path("skipped");
        return new Result.Success(usage, items, discarded, skipped.isArray() ? skipped.size() : 0, warnings);
    }

    private Optional<CollectedNews> toNews(
            final JsonNode item,
            final String account,
            @Nullable final String link,
            @Nullable final Boolean verified
    ) {
        Optional<NewsSection> section = NewsSection.from(text(item, "section"));
        Optional<NewsKind> kind = NewsKind.from(text(item, "kind"));
        String title = text(item, "title");
        if (section.isEmpty() || kind.isEmpty() || title == null || title.isBlank()) {
            return Optional.empty();
        }
        NewsDetail detail = new NewsDetail(
                text(item, "date_label"),
                text(item, "location"),
                products(item.path("products")),
                reservation(item.path("reservation")),
                strings(item.path("notes")),
                text(item, "ref_url"),
                account);
        return Optional.of(new CollectedNews(section.get(), kind.get(), title,
                date(text(item, "start_date")), date(text(item, "end_date")),
                link == null || link.isBlank() ? null : link, verified, null, detail));
    }

    private String rejectionReason(final JsonNode item) {
        if (NewsSection.from(text(item, "section")).isEmpty()) {
            return "section 허용 값 아님: " + text(item, "section");
        }
        if (NewsKind.from(text(item, "kind")).isEmpty()) {
            return "kind 허용 값 아님: " + text(item, "kind");
        }
        return "제목 없음";
    }

    /**
     * citations(문자열 또는 url 을 가진 객체)와 응답 안 모든 객체의 url 필드를 정규화해 모은다.
     */
    private Set<String> collectCitedUrls(final JsonNode response) {
        Set<String> urls = new TreeSet<>();
        for (JsonNode citation : arrayOrEmpty(response.path("citations"))) {
            JsonNode url = citation.isObject() ? citation.path("url") : citation;
            if (url.isString()) {
                urls.add(NewsLink.normalize(url.stringValue()));
            }
        }
        collectUrlFields(response, urls);
        return urls;
    }

    private void collectUrlFields(final JsonNode node, final Set<String> urls) {
        if (node.isObject() && node.path("url").isString()) {
            urls.add(NewsLink.normalize(node.path("url").stringValue()));
        }
        if (node.isContainer()) {
            node.values().forEach(child -> collectUrlFields(child, urls));
        }
    }

    private String outputText(final JsonNode response) {
        StringBuilder text = new StringBuilder();
        for (JsonNode output : arrayOrEmpty(response.path("output"))) {
            if (!"message".equals(output.path("type").asString(""))) {
                continue;
            }
            for (JsonNode part : arrayOrEmpty(output.path("content"))) {
                if ("output_text".equals(part.path("type").asString("")) && part.path("text").isString()) {
                    text.append(part.path("text").stringValue());
                }
            }
        }
        return text.toString();
    }

    /**
     * 모델이 마크다운 코드 블록으로 감싸 보내면 벗겨낸다.
     */
    private String stripCodeFence(final String text) {
        return TRAILING_FENCE.matcher(LEADING_FENCE.matcher(text).replaceFirst("")).replaceFirst("");
    }

    private @Nullable JsonNode readJson(final String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(text);
        } catch (JacksonException e) {
            return null;
        }
    }

    private List<NewsDetail.Product> products(final JsonNode products) {
        List<NewsDetail.Product> result = new ArrayList<>();
        for (JsonNode product : arrayOrEmpty(products)) {
            if (product.isObject()) {
                result.add(new NewsDetail.Product(
                        text(product, "name"), text(product, "name_ja"), text(product, "price")));
            }
        }
        return result;
    }

    private NewsDetail.@Nullable Reservation reservation(final JsonNode reservation) {
        if (!reservation.isObject()) {
            return null;
        }
        return new NewsDetail.Reservation(text(reservation, "method"), text(reservation, "period"),
                text(reservation, "open_at"), text(reservation, "note"));
    }

    private List<String> strings(final JsonNode values) {
        List<String> result = new ArrayList<>();
        for (JsonNode value : arrayOrEmpty(values)) {
            if (value.isString()) {
                result.add(value.stringValue());
            }
        }
        return result;
    }

    private @Nullable LocalDate date(@Nullable final String value) {
        if (value == null || !ISO_DATE.matcher(value).matches()) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    /**
     * 모르는 값은 null 이다. 모델이 빈 문자열이나 "미정" 같은 말로 채워도 null 로 정리한다.
     */
    private @Nullable String text(final JsonNode node, final String field) {
        JsonNode value = node.path(field);
        if (!value.isString()) {
            return null;
        }
        String text = value.stringValue().strip();
        return text.isEmpty() || UNKNOWN_WORDS.contains(text.toLowerCase(Locale.ROOT)) ? null : text;
    }

    private Iterable<JsonNode> arrayOrEmpty(final JsonNode node) {
        return node.isArray() ? node : List.of();
    }

    private String preview(final JsonNode error) {
        String value = error.isString() ? error.stringValue() : error.toString();
        return value.length() > ERROR_PREVIEW_LENGTH ? value.substring(0, ERROR_PREVIEW_LENGTH) : value;
    }

    /**
     * 응답 하나를 해석한 결과.
     */
    public sealed interface Result {

        /**
         * @param discarded   형식 검사에서 버린 소식과 이유
         * @param skippedPosts Grok 이 굿즈와 무관하다고 보고 뺀 게시물 수
         */
        record Success(
                GrokUsage usage,
                List<CollectedNews> items,
                List<Discarded> discarded,
                int skippedPosts,
                List<String> warnings
        ) implements Result {

            public Success {
                items = List.copyOf(items);
                discarded = List.copyOf(discarded);
                warnings = List.copyOf(warnings);
            }
        }

        record Failure(String reason) implements Result {
        }
    }

    public record Discarded(@Nullable String title, @Nullable String link, String reason) {

        public String warning() {
            return "버린 소식: " + title + " (" + reason + ")";
        }
    }
}

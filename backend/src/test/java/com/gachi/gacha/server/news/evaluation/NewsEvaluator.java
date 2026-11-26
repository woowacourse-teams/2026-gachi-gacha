package com.gachi.gacha.server.news.evaluation;

import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsLink;
import com.gachi.gacha.server.news.domain.NewsReview;
import com.gachi.gacha.server.news.domain.NewsSection;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.jspecify.annotations.Nullable;

/**
 * 사람이 X 에서 직접 모은 정답 세트(CSV)와 파이프라인이 저장한 후보를 비교해 수집 품질을 잰다. 개발용 평가 도구이고
 * Grok 을 호출하지 않는다. 실행 방법은 {@link NewsEvaluationRunTest} 를 본다.
 *
 * <p>정답 세트 형식: {@code account,link,posted_at,summary,section,kind,start_date,end_date,push_target}.
 * section·kind 는 서버가 쓰는 값(korea_store, release 등), push_target 은 O 또는 X, posted_at 은 시간대가 없으면 KST 로 읽는다.
 *
 * <ul>
 *   <li>누락률 = 푸시 대상(O) 정답 중 파이프라인이 푸시 대상으로 찾지 못한 수 ÷ 푸시 대상(O) 정답 수</li>
 *   <li>오탐 = 파이프라인은 푸시 대상이라고 했는데 정답은 X 인 수</li>
 *   <li>분류 일치율 = 파이프라인이 찾은 정답 중 section 과 kind 가 모두 정답과 같은 비율</li>
 *   <li>행사 전 도착률 = 푸시 대상(O) 정답 중 "게시 이후 첫 정기 수집"이 행사 시작일 00:00(KST)보다 이른 비율. CSV 만으로 계산한다</li>
 * </ul>
 */
public final class NewsEvaluator {

    public static final double MAX_MISS_RATE = 0.10;
    public static final double MIN_BEFORE_EVENT_RATE = 0.80;

    private static final List<String> HEADER = List.of("account", "link", "posted_at", "summary", "section", "kind",
            "start_date", "end_date", "push_target");

    private final ZoneId zone;
    private final List<CollectionSlot> slots;

    public NewsEvaluator() {
        this(ZoneId.of("Asia/Seoul"), List.of(
                new CollectionSlot(DayOfWeek.MONDAY, LocalTime.of(18, 30)),
                new CollectionSlot(DayOfWeek.THURSDAY, LocalTime.of(12, 30))));
    }

    public NewsEvaluator(final ZoneId zone, final List<CollectionSlot> slots) {
        this.zone = zone;
        this.slots = List.copyOf(slots);
    }

    /**
     * @throws IllegalArgumentException 형식이 틀린 줄이 있으면 몇 번째 줄인지와 함께 알린다
     */
    public List<Answer> parse(final String csv) {
        List<Row> rows = readRows(csv);
        if (rows.isEmpty() || !HEADER.equals(rows.getFirst().fields().stream().map(String::strip).toList())) {
            throw new IllegalArgumentException("첫 줄은 헤더여야 한다: " + String.join(",", HEADER));
        }
        List<Answer> answers = new ArrayList<>();
        Map<String, Integer> lineByKey = new LinkedHashMap<>();
        for (Row row : rows.subList(1, rows.size())) {
            Answer answer = toAnswer(row);
            Integer previous = lineByKey.putIfAbsent(answer.linkKey(), row.line());
            if (previous != null) {
                throw new IllegalArgumentException(row.line() + "번째 줄: " + previous + "번째 줄과 같은 게시물이다");
            }
            answers.add(answer);
        }
        return answers;
    }

    public Report evaluate(final List<Answer> answers, final List<NewsCandidate> candidates) {
        Map<String, NewsCandidate> found = new LinkedHashMap<>();
        candidates.stream().filter(candidate -> !candidate.linkKey().isEmpty())
                .forEach(candidate -> found.putIfAbsent(candidate.linkKey(), candidate));
        Map<String, Answer> answerByKey = new LinkedHashMap<>();
        answers.forEach(answer -> answerByKey.put(answer.linkKey(), answer));

        List<Miss> misses = new ArrayList<>();
        List<Arrival> arrivals = new ArrayList<>();
        int pushAnswers = 0;
        for (Answer answer : answers) {
            if (!answer.pushTarget()) {
                continue;
            }
            pushAnswers++;
            NewsCandidate candidate = found.get(answer.linkKey());
            if (candidate == null || currentReview(candidate) != NewsReview.PUSH_TARGET) {
                misses.add(new Miss(answer, missReason(candidate)));
            }
            arrivals.add(arrival(answer));
        }

        List<NewsCandidate> pushed = found.values().stream()
                .filter(candidate -> currentReview(candidate) == NewsReview.PUSH_TARGET).toList();
        List<NewsCandidate> falsePositives = pushed.stream()
                .filter(candidate -> answerByKey.containsKey(candidate.linkKey())
                        && !answerByKey.get(candidate.linkKey()).pushTarget()).toList();
        List<NewsCandidate> unlisted = pushed.stream()
                .filter(candidate -> !answerByKey.containsKey(candidate.linkKey())).toList();

        List<Mismatch> mismatches = new ArrayList<>();
        int foundAnswers = 0;
        int classified = 0;
        for (Answer answer : answers) {
            NewsCandidate candidate = found.get(answer.linkKey());
            if (candidate == null) {
                continue;
            }
            foundAnswers++;
            if (candidate.getSection() == answer.section() && candidate.getKind() == answer.kind()) {
                classified++;
            } else {
                mismatches.add(new Mismatch(answer, candidate));
            }
        }
        return new Report(answers.size(), pushAnswers, misses, falsePositives, unlisted, foundAnswers, classified,
                mismatches, arrivals);
    }

    /**
     * 게시 시각 이후 처음 오는 정기 수집 시각. 게시와 같은 시각이면 다음 수집이다.
     */
    public LocalDateTime firstCollectionAfter(final LocalDateTime postedAt) {
        LocalDateTime earliest = null;
        for (int offset = 0; offset <= 7; offset++) {
            LocalDate date = postedAt.toLocalDate().plusDays(offset);
            for (CollectionSlot slot : slots) {
                LocalDateTime at = date.atTime(slot.time());
                if (date.getDayOfWeek() == slot.dayOfWeek() && at.isAfter(postedAt) && (earliest == null || at.isBefore(earliest))) {
                    earliest = at;
                }
            }
        }
        if (earliest == null) {
            throw new IllegalStateException("수집 일정이 없다");
        }
        return earliest;
    }

    private Arrival arrival(final Answer answer) {
        if (answer.startDate() == null) {
            return new Arrival(answer, null, false);
        }
        LocalDateTime collectedAt = firstCollectionAfter(answer.postedAt());
        return new Arrival(answer, collectedAt, collectedAt.isBefore(answer.startDate().atStartOfDay()));
    }

    /**
     * 저장된 review 는 수집 당시 푸시 규칙으로 정해졌다. 규칙이 바뀐 뒤에도 이전 회차를 평가할 수 있도록, 공개 대상으로만
     * 저장된 후보(링크 검증 완료, 끝나지 않음)는 구분과 종류를 현재 규칙으로 다시 본다.
     */
    private NewsReview currentReview(final NewsCandidate candidate) {
        NewsReview stored = candidate.getReview();
        if (stored == NewsReview.TAB_ONLY && candidate.getSection().isPushTarget() && candidate.getKind().isPushTarget()) {
            return NewsReview.PUSH_TARGET;
        }
        return stored;
    }

    private MissReason missReason(@Nullable final NewsCandidate candidate) {
        if (candidate == null) {
            return MissReason.NOT_COLLECTED;
        }
        return switch (currentReview(candidate)) {
            case NEEDS_CHECK -> MissReason.NEEDS_CHECK;
            case ENDED -> MissReason.ENDED;
            default -> MissReason.TAB_ONLY;
        };
    }

    private Answer toAnswer(final Row row) {
        List<String> fields = row.fields().stream().map(String::strip).toList();
        if (fields.size() != HEADER.size()) {
            throw new IllegalArgumentException(row.line() + "번째 줄: 열이 " + HEADER.size() + "개여야 한다 (" + fields.size() + "개)");
        }
        String link = fields.get(1);
        if (link.isEmpty()) {
            throw new IllegalArgumentException(row.line() + "번째 줄: link 가 비어 있다");
        }
        NewsSection section = NewsSection.from(fields.get(4)).orElseThrow(
                () -> new IllegalArgumentException(row.line() + "번째 줄: section 허용 값 아님: " + fields.get(4)));
        NewsKind kind = NewsKind.from(fields.get(5)).orElseThrow(
                () -> new IllegalArgumentException(row.line() + "번째 줄: kind 허용 값 아님: " + fields.get(5)));
        return new Answer(row.line(), fields.get(0), link, NewsLink.normalize(link),
                parseDateTime(fields.get(2), row.line()), fields.get(3), section, kind,
                parseDate(fields.get(6), "start_date", row.line()), parseDate(fields.get(7), "end_date", row.line()),
                parsePushTarget(fields.get(8), row.line()));
    }

    private boolean parsePushTarget(final String value, final int line) {
        return switch (value.toUpperCase(Locale.ROOT)) {
            case "O" -> true;
            case "X" -> false;
            default -> throw new IllegalArgumentException(line + "번째 줄: push_target 은 O 또는 X 여야 한다: " + value);
        };
    }

    private @Nullable LocalDate parseDate(final String value, final String column, final int line) {
        if (value.isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(line + "번째 줄: " + column + " 형식은 YYYY-MM-DD 여야 한다: " + value);
        }
    }

    /**
     * 시간대가 있으면 KST 로 바꾸고, 없으면 KST 로 본다. 날짜와 시각 사이는 T 나 공백을 모두 받는다.
     */
    private LocalDateTime parseDateTime(final String value, final int line) {
        String normalized = value.replace(' ', 'T');
        try {
            return OffsetDateTime.parse(normalized).atZoneSameInstant(zone).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            // 시간대가 없는 값이다
        }
        try {
            return LocalDateTime.parse(normalized);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(line + "번째 줄: posted_at 형식은 2026-11-05T09:30 같아야 한다: " + value);
        }
    }

    /**
     * 따옴표로 감싼 칸 안의 쉼표·줄바꿈·"" 를 처리하는 최소한의 CSV 읽기. 빈 줄은 건너뛴다.
     */
    private List<Row> readRows(final String csv) {
        List<Row> rows = new ArrayList<>();
        List<String> fields = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean quoted = false;
        int line = 1;
        int rowLine = 1;
        for (int index = 0; index < csv.length(); index++) {
            char character = csv.charAt(index);
            if (quoted) {
                if (character == '"' && index + 1 < csv.length() && csv.charAt(index + 1) == '"') {
                    field.append('"');
                    index++;
                } else if (character == '"') {
                    quoted = false;
                } else {
                    field.append(character);
                    line += character == '\n' ? 1 : 0;
                }
            } else if (character == '"') {
                quoted = true;
            } else if (character == ',') {
                fields.add(field.toString());
                field.setLength(0);
            } else if (character == '\n') {
                addRow(rows, fields, field, rowLine);
                line++;
                rowLine = line;
            } else if (character != '\r') {
                field.append(character);
            }
        }
        addRow(rows, fields, field, rowLine);
        return rows;
    }

    private void addRow(final List<Row> rows, final List<String> fields, final StringBuilder field, final int line) {
        fields.add(field.toString());
        field.setLength(0);
        if (fields.stream().anyMatch(value -> !value.isBlank())) {
            rows.add(new Row(line, List.copyOf(fields)));
        }
        fields.clear();
    }

    /**
     * 평가 결과를 마크다운으로 만든다. 목표에 못 미쳐도 고치지 않고 수치와 원인 후보만 보여준다.
     */
    public String toMarkdown(final Report report) {
        StringBuilder text = new StringBuilder("# 신상 소식 수집 평가\n\n");
        text.append("정답 ").append(report.answerCount()).append("건 (푸시 대상 O ").append(report.pushAnswerCount()).append("건)\n\n");
        text.append("| 지표 | 값 | 목표 | 판정 |\n|---|---|---|---|\n");
        text.append("| 누락률 | ").append(percent(report.missRate().orElse(null), report.misses().size(), report.pushAnswerCount()))
                .append(" | 10% 이하 | ").append(verdict(report.missRate().isPresent(), report.meetsMissTarget())).append(" |\n");
        text.append("| 오탐 | ").append(report.falsePositives().size()).append("건 | - | - |\n");
        text.append("| 분류 일치율 | ").append(percent(report.classificationRate().orElse(null), report.classifiedCount(),
                report.foundAnswerCount())).append(" | - | - |\n");
        long eligible = report.arrivals().stream().filter(arrival -> arrival.collectedAt() != null).count();
        text.append("| 행사 전 도착률 | ").append(percent(report.beforeEventRate().orElse(null),
                report.arrivals().stream().filter(Arrival::beforeEvent).count(), eligible))
                .append(" | 80% 이상 | ").append(verdict(report.beforeEventRate().isPresent(), report.meetsBeforeEventTarget()))
                .append(" |\n");
        long unknownStart = report.arrivals().size() - eligible;
        if (unknownStart > 0) {
            text.append("\n행사 시작일을 몰라 행사 전 도착률에서 뺀 정답: ").append(unknownStart).append("건\n");
        }

        section(text, "누락 (푸시 대상인데 찾지 못함)", report.misses().stream()
                .map(miss -> "- " + miss.answer().link() + " · " + miss.answer().summary() + " — " + miss.reason().label()).toList());
        section(text, "오탐 (정답은 푸시 대상 아님)", report.falsePositives().stream()
                .map(candidate -> "- " + candidate.getLink() + " · " + candidate.getTitle()).toList());
        section(text, "정답에 없는 푸시 대상 (정답 세트에 빠졌는지 확인)", report.unlistedPushTargets().stream()
                .map(candidate -> "- " + candidate.getLink() + " · " + candidate.getTitle()).toList());
        section(text, "분류가 다른 소식", report.mismatches().stream()
                .map(mismatch -> "- " + mismatch.answer().link() + " · section " + mismatch.answer().section().getValue()
                        + " → " + mismatch.candidate().getSection().getValue() + ", kind " + mismatch.answer().kind().getValue()
                        + " → " + mismatch.candidate().getKind().getValue()).toList());
        section(text, "행사 전에 도착하지 못한 소식", report.arrivals().stream()
                .filter(arrival -> arrival.collectedAt() != null && !arrival.beforeEvent())
                .map(arrival -> "- " + arrival.answer().link() + " · 게시 " + arrival.answer().postedAt() + " · 첫 수집 "
                        + arrival.collectedAt() + " · 행사 시작 " + arrival.answer().startDate()).toList());
        return text.toString();
    }

    private void section(final StringBuilder text, final String title, final List<String> lines) {
        if (lines.isEmpty()) {
            return;
        }
        text.append("\n## ").append(title).append(" ").append(lines.size()).append("건\n");
        lines.forEach(line -> text.append(line).append('\n'));
    }

    private String percent(@Nullable final Double rate, final long numerator, final long denominator) {
        return rate == null ? "해당 없음" : String.format(Locale.ROOT, "%.1f%% (%d/%d)", rate * 100, numerator, denominator);
    }

    private String verdict(final boolean measurable, final boolean met) {
        return !measurable ? "측정 불가" : met ? "충족" : "미달";
    }

    private record Row(int line, List<String> fields) {
    }

    /**
     * 정기 수집 시각 (예: 월요일 18:30).
     */
    public record CollectionSlot(DayOfWeek dayOfWeek, LocalTime time) {
    }

    public record Answer(
            int line,
            String account,
            String link,
            String linkKey,
            LocalDateTime postedAt,
            String summary,
            NewsSection section,
            NewsKind kind,
            @Nullable LocalDate startDate,
            @Nullable LocalDate endDate,
            boolean pushTarget
    ) {
    }

    /**
     * 푸시 대상(O)인데 파이프라인이 푸시 대상으로 찾지 못한 소식.
     */
    public record Miss(Answer answer, MissReason reason) {
    }

    public enum MissReason {
        NOT_COLLECTED("수집하지 못함"),
        NEEDS_CHECK("링크를 확인하지 못해 확인 필요로 분류됨"),
        ENDED("종료로 분류됨"),
        TAB_ONLY("푸시 대상이 아닌 구분(section)이나 종류(kind)로 분류됨");

        private final String label;

        MissReason(final String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    public record Mismatch(Answer answer, NewsCandidate candidate) {
    }

    /**
     * @param collectedAt 게시 이후 첫 정기 수집 시각. 행사 시작일이 없으면 null
     */
    public record Arrival(Answer answer, @Nullable LocalDateTime collectedAt, boolean beforeEvent) {
    }

    public record Report(
            int answerCount,
            int pushAnswerCount,
            List<Miss> misses,
            List<NewsCandidate> falsePositives,
            List<NewsCandidate> unlistedPushTargets,
            int foundAnswerCount,
            int classifiedCount,
            List<Mismatch> mismatches,
            List<Arrival> arrivals
    ) {

        /**
         * @return 푸시 대상 정답이 없으면 비어 있다
         */
        public Optional<Double> missRate() {
            return pushAnswerCount == 0 ? Optional.empty() : Optional.of((double) misses.size() / pushAnswerCount);
        }

        public Optional<Double> classificationRate() {
            return foundAnswerCount == 0 ? Optional.empty() : Optional.of((double) classifiedCount / foundAnswerCount);
        }

        /**
         * 행사 시작일을 아는 푸시 대상 정답 중 행사 전에 도착한 비율.
         */
        public Optional<Double> beforeEventRate() {
            long eligible = arrivals.stream().filter(arrival -> arrival.collectedAt() != null).count();
            long before = arrivals.stream().filter(Arrival::beforeEvent).count();
            return eligible == 0 ? Optional.empty() : Optional.of((double) before / eligible);
        }

        public boolean meetsMissTarget() {
            return missRate().map(rate -> rate <= MAX_MISS_RATE).orElse(false);
        }

        public boolean meetsBeforeEventTarget() {
            return beforeEventRate().map(rate -> rate >= MIN_BEFORE_EVENT_RATE).orElse(false);
        }
    }
}

package com.gachi.gacha.server.news.application;

import com.gachi.gacha.server.news.application.dto.NewsRunResult;
import com.gachi.gacha.server.news.domain.CollectPeriod;
import com.gachi.gacha.server.news.domain.GrokUsage;
import com.gachi.gacha.server.news.domain.NewsBatch;
import com.gachi.gacha.server.news.domain.NewsBatchStatus;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsDateFormat;
import com.gachi.gacha.server.news.domain.NewsReview;
import com.gachi.gacha.server.news.infra.NewsProperties;
import com.gachi.gacha.server.news.infra.SlackClient.SlackMessage;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

/**
 * 수집 결과로 슬랙 메시지(Block Kit)를 만든다. 슬랙을 호출하지 않는 순수한 변환이다.
 *
 * <p>슬랙은 메시지 하나에 블록 50개, 글 블록 하나에 3000자까지만 받는다. 목록은 줄 수를 제한하고 "외 N건"으로 줄이며,
 * 그래도 길면 뒤쪽 블록을 생략한다.
 */
@Component
@RequiredArgsConstructor
public class NewsSlackMessageBuilder {

    private static final int MAX_BLOCKS = 45;
    private static final int MAX_SECTION_LENGTH = 2900;
    private static final int MAX_TITLE_LENGTH = 100;
    private static final int PUSH_TARGET_LINES = 30;
    private static final int TAB_ONLY_LINES = 30;
    private static final int NEEDS_CHECK_LINES = 20;
    private static final int ENDED_LINES = 10;
    private static final int WARNING_LINES = 15;
    private static final Pattern SAFE_LINK = Pattern.compile("^https?://[^\\s<>|]+$");
    private static final Comparator<NewsCandidate> EARLIEST_START_FIRST = Comparator
            .comparing(NewsCandidate::getStartDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(NewsCandidate::getId, Comparator.nullsLast(Comparator.naturalOrder()));

    private final NewsProperties properties;
    private final ObjectMapper objectMapper;

    public SlackMessage build(final NewsRunResult.Finished result) {
        NewsBatch batch = result.batch();
        List<NewsCandidate> candidates = result.candidates();
        String summary = summary(result);

        List<String> sections = new ArrayList<>();
        sections.add("*" + title(batch.getTopic(), batch.isDryRun()) + "*\n" + summary);
        sections.add("*수집 기간 (UTC)*\n" + periodLines(batch.periods()));
        addList(sections, "푸시 대상", candidates, NewsReview.PUSH_TARGET, PUSH_TARGET_LINES, false);
        addList(sections, "탭에만 공개", candidates, NewsReview.TAB_ONLY, TAB_ONLY_LINES, false);
        addList(sections, "확인 필요 (링크 미확인)", candidates, NewsReview.NEEDS_CHECK, NEEDS_CHECK_LINES, true);
        addList(sections, "지난 소식", candidates, NewsReview.ENDED, ENDED_LINES, false);
        addNotes(sections, batch.warnings(), result.stats());
        if (batch.isDryRun()) {
            sections.add("_dry-run 이라 공개와 푸시를 하지 않습니다._");
        }
        return new SlackMessage(fallbackText(summary), toBlocks(sections));
    }

    public SlackMessage skipped(final NewsRunResult.Skipped skipped) {
        String text = prefix(false) + displayName(skipped.topic()) + " 신상 소식 · " + runLabel(skipped.runName())
                + " 수집을 건너뜀: " + skipped.reason();
        return new SlackMessage(text, toBlocks(List.of(escape(text))));
    }

    /**
     * 실행 보고 한 줄. 요청서의 형식을 따른다. 예) 목요일 수집 완료 · 게시물 23건 확인 · 새 푸시 대상 2건 · 탭 공개 대상 6건 ·
     * 확인 필요 1건 · 비용 $0.3126 · 프롬프트 chiikawa-v2
     */
    String summary(final NewsRunResult.Finished result) {
        NewsBatch batch = result.batch();
        List<NewsCandidate> candidates = result.candidates();
        GrokUsage usage = batch.usage();
        String run = runLabel(batch.getRunName());
        String tail = " · 비용 $" + usage.formattedCostUsd() + " · 프롬프트 " + batch.getPromptVersion();

        if (batch.getStatus() == NewsBatchStatus.FAILED) {
            List<String> warnings = batch.warnings();
            String reason = warnings.isEmpty() ? "알 수 없음" : warnings.getLast();
            return escape(run + " 수집 실패 · 원인: " + reason + tail);
        }
        boolean partial = batch.periods().stream().anyMatch(period -> !period.collected());
        StringBuilder text = new StringBuilder(run).append(partial ? " 수집 완료 (일부 계정 실패)" : " 수집 완료");
        text.append(" · 게시물 ").append(usage.postsFetched()).append("건 확인");
        if (batch.getStatus() == NewsBatchStatus.NO_NEWS) {
            text.append(" · 새 소식 없음");
        }
        text.append(" · 새 푸시 대상 ").append(count(candidates, NewsReview.PUSH_TARGET)).append("건");
        text.append(" · 탭 공개 대상 ").append(count(candidates, NewsReview.PUSH_TARGET) + count(candidates, NewsReview.TAB_ONLY)).append("건");
        text.append(" · 확인 필요 ").append(count(candidates, NewsReview.NEEDS_CHECK)).append("건");
        return escape(text.append(tail).toString());
    }

    private String title(final String topic, final boolean dryRun) {
        return escape(prefix(dryRun) + displayName(topic) + " 신상 소식");
    }

    private String prefix(final boolean dryRun) {
        String label = properties.environmentLabel();
        return (label.isEmpty() ? "" : label + " ") + (dryRun ? "[DRY-RUN] " : "");
    }

    private String displayName(final String topic) {
        return properties.topic(topic).map(NewsProperties.Topic::displayName).orElse(topic);
    }

    private String runLabel(final String runName) {
        return switch (runName) {
            case "MONDAY" -> "월요일";
            case "THURSDAY" -> "목요일";
            case "RECOLLECT" -> "다시 수집";
            default -> runName;
        };
    }

    private String periodLines(final List<CollectPeriod> periods) {
        List<String> lines = periods.stream()
                .map(period -> "• " + period.handle() + "  " + shortDay(period.from()) + " ~ " + shortDay(period.to())
                        + (period.collected() ? "  ✅" : "  ❌ 수집하지 못함 (다음 수집이 이 기간부터 다시 가져옴)"))
                .toList();
        return String.join("\n", lines);
    }

    private void addList(
            final List<String> sections,
            final String heading,
            final List<NewsCandidate> candidates,
            final NewsReview review,
            final int maxLines,
            final boolean showLinkStatus
    ) {
        List<NewsCandidate> matched = candidates.stream()
                .filter(candidate -> candidate.getReview() == review)
                .sorted(EARLIEST_START_FIRST)
                .toList();
        if (matched.isEmpty()) {
            return;
        }
        List<String> lines = new ArrayList<>();
        matched.stream().limit(maxLines).forEach(candidate -> lines.add(candidateLine(candidate, showLinkStatus)));
        if (matched.size() > maxLines) {
            lines.add("… 외 " + (matched.size() - maxLines) + "건");
        }
        sections.add("*" + heading + " " + matched.size() + "건*\n" + String.join("\n", lines));
    }

    private String candidateLine(final NewsCandidate candidate, final boolean showLinkStatus) {
        String date = dateText(candidate);
        StringBuilder line = new StringBuilder("• [").append(candidate.getKind().getLabel());
        if (!date.isEmpty()) {
            line.append(' ').append(date);
        }
        line.append("] ").append(escape(limit(candidate.getTitle(), MAX_TITLE_LENGTH)));
        line.append(" · ").append(candidate.getSection().getLabel());
        String link = candidate.getLink();
        if (link != null && SAFE_LINK.matcher(link).matches()) {
            line.append(" · <").append(link).append("|게시물>");
        } else if (showLinkStatus) {
            line.append(" · 링크 없음");
        }
        return line.toString();
    }

    private String dateText(final NewsCandidate candidate) {
        LocalDate start = candidate.getStartDate();
        LocalDate end = candidate.getEndDate();
        if (start != null && end != null && !start.equals(end)) {
            return NewsDateFormat.shortDate(start) + "~" + NewsDateFormat.shortDate(end);
        }
        if (start != null) {
            return NewsDateFormat.shortDate(start);
        }
        if (end != null) {
            return "~" + NewsDateFormat.shortDate(end);
        }
        String label = candidate.detail().dateLabel();
        return label == null ? "" : escape(limit(label, 30));
    }

    private void addNotes(final List<String> sections, final List<String> warnings, final NewsRunResult.Stats stats) {
        List<String> lines = new ArrayList<>();
        warnings.stream().limit(WARNING_LINES).forEach(warning -> lines.add("• " + escape(limit(warning, 300))));
        if (warnings.size() > WARNING_LINES) {
            lines.add("… 외 " + (warnings.size() - WARNING_LINES) + "건");
        }
        if (stats.duplicates() + stats.discarded() + stats.skippedPosts() > 0) {
            lines.add("_제외: 중복 " + stats.duplicates() + " · 형식 오류 " + stats.discarded()
                    + " · 굿즈 아님 " + stats.skippedPosts() + "_");
        }
        if (!lines.isEmpty()) {
            sections.add("*확인할 내용*\n" + String.join("\n", lines));
        }
    }

    /**
     * 글 블록 하나가 3000자를 넘지 않게 줄 단위로 나누고, 블록이 너무 많으면 뒤쪽을 생략한다.
     */
    private ArrayNode toBlocks(final List<String> sections) {
        List<String> texts = new ArrayList<>();
        sections.forEach(section -> texts.addAll(chunk(section)));
        ArrayNode blocks = objectMapper.createArrayNode();
        int shown = Math.min(texts.size(), MAX_BLOCKS);
        for (int index = 0; index < shown; index++) {
            blocks.add(sectionBlock(texts.get(index)));
        }
        if (texts.size() > MAX_BLOCKS) {
            blocks.add(sectionBlock("_길이 제한으로 나머지 " + (texts.size() - MAX_BLOCKS) + "개 블록은 생략했습니다._"));
        }
        return blocks;
    }

    private List<String> chunk(final String text) {
        List<String> chunks = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String line : text.split("\n", -1)) {
            String safeLine = limit(line, MAX_SECTION_LENGTH);
            if (current.length() + safeLine.length() + 1 > MAX_SECTION_LENGTH && !current.isEmpty()) {
                chunks.add(current.toString());
                current.setLength(0);
            }
            if (!current.isEmpty()) {
                current.append('\n');
            }
            current.append(safeLine);
        }
        chunks.add(current.toString());
        return chunks;
    }

    private ObjectNode sectionBlock(final String text) {
        ObjectNode block = objectMapper.createObjectNode().put("type", "section");
        block.putObject("text").put("type", "mrkdwn").put("text", text);
        return block;
    }

    private String fallbackText(final String summary) {
        return limit(summary, MAX_SECTION_LENGTH);
    }

    private int count(final List<NewsCandidate> candidates, final NewsReview review) {
        return (int) candidates.stream().filter(candidate -> candidate.getReview() == review).count();
    }

    private String shortDay(final LocalDate date) {
        return date.getMonthValue() + "/" + date.getDayOfMonth();
    }

    private String limit(final String text, final int max) {
        return text.length() > max ? text.substring(0, max - 1) + "…" : text;
    }

    /**
     * 슬랙 mrkdwn 에서 & < > 는 문자 그대로 쓸 수 없다.
     */
    static String escape(@Nullable final String text) {
        return text == null ? "" : text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}

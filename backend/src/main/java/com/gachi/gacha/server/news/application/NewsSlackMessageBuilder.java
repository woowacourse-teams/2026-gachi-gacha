package com.gachi.gacha.server.news.application;

import com.gachi.gacha.server.news.application.dto.BatchView;
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
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
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

    public static final String ACTION_EXCLUDE = "news_exclude";
    public static final String ACTION_UNDO_EXCLUDE = "news_undo_exclude";
    public static final String ACTION_APPROVE = "news_approve";
    public static final String ACTION_RECOLLECT = "news_recollect";
    public static final String ACTION_TEST_SEND = "news_test_send";

    private static final int MAX_BLOCKS = 45;
    private static final int MAX_SECTION_LENGTH = 2900;
    private static final int MAX_TITLE_LENGTH = 100;
    private static final int PUSH_TARGET_LINES = 30;
    private static final int TAB_ONLY_LINES = 30;
    private static final int NEEDS_CHECK_LINES = 20;
    private static final int ENDED_LINES = 10;
    private static final int WARNING_LINES = 15;
    private static final Pattern SAFE_LINK = Pattern.compile("^https?://[^\\s<>|]+$");
    private static final Pattern SLACK_USER_ID = Pattern.compile("^[UW][A-Z0-9]+$");
    private static final Comparator<NewsCandidate> EARLIEST_START_FIRST = Comparator
            .comparing(NewsCandidate::getStartDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(NewsCandidate::getId, Comparator.nullsLast(Comparator.naturalOrder()));

    private final NewsProperties properties;
    private final ObjectMapper objectMapper;

    /**
     * 수집을 마친 직후의 실행 보고(승인 요청). 아직 표도 제외도 없다.
     */
    public SlackMessage build(final NewsRunResult.Finished result) {
        return render(new BatchView(result.batch(), result.candidates(), List.of(), Set.of()));
    }

    /**
     * 회차의 현재 상태로 메시지를 다시 그린다. 승인 진행, 제외·되돌리기, 승인됨, 버려짐이 반영된다.
     */
    public SlackMessage render(final BatchView view) {
        return render(view, null);
    }

    /**
     * 다음 수집이 시작돼 승인 대기 회차가 만료됐을 때의 메시지. 버튼을 없애고 몇 건을 다음 묶음으로 넘겼는지 보여준다.
     */
    public SlackMessage renderExpired(final BatchView view, final int carriedCount) {
        return render(view, "⏰ *만료됨* · " + carriedCount + "건은 다음 묶음으로 이월");
    }

    private SlackMessage render(final BatchView view, @Nullable final String expiredLine) {
        NewsBatch batch = view.batch();
        String summary = summary(view);

        boolean approvalRequest = !batch.isDryRun() && batch.getStatus() == NewsBatchStatus.AWAITING_APPROVAL;
        List<ObjectNode> blocks = new ArrayList<>();
        addText(blocks, "*" + title(batch.getTopic(), batch.isDryRun()) + "*\n" + summary);
        String status = statusLine(view, expiredLine);
        if (status != null) {
            addText(blocks, status);
        }
        addText(blocks, "*수집 기간 (UTC)*\n" + periodLines(batch.periods()));
        if (approvalRequest) {
            addPushTargetsWithButtons(blocks, view);
        } else {
            addList(blocks, "푸시 대상", view, NewsReview.PUSH_TARGET, PUSH_TARGET_LINES, false);
        }
        addList(blocks, "탭에만 공개", view, NewsReview.TAB_ONLY, TAB_ONLY_LINES, false);
        addList(blocks, "확인 필요 (링크 미확인)", view, NewsReview.NEEDS_CHECK, NEEDS_CHECK_LINES, true);
        addList(blocks, "지난 소식", view, NewsReview.ENDED, ENDED_LINES, false);
        addNotes(blocks, batch.warnings());
        if (batch.isDryRun()) {
            addText(blocks, "_dry-run 이라 공개와 푸시를 하지 않습니다._");
        }
        if (approvalRequest) {
            addText(blocks, "_서로 다른 " + properties.requiredApprovals() + "명이 [승인]을 누르면 승인됩니다. 푸시 대상은 [제외]로 뺄 수 있습니다._");
        }
        ObjectNode actions = approvalRequest ? approvalActions(batch.getId(), activeCount(view, NewsReview.PUSH_TARGET)) : null;
        return new SlackMessage(fallbackText(summary), toBlocks(blocks, actions));
    }

    public SlackMessage skipped(final NewsRunResult.Skipped skipped) {
        String text = prefix(false) + displayName(skipped.topic()) + " 신상 소식 · " + runLabel(skipped.runName())
                + " 수집을 건너뜀: " + skipped.reason();
        return new SlackMessage(text, toBlocks(List.of(sectionBlock(escape(text))), null));
    }

    /**
     * 실행 보고 한 줄. 요청서의 형식을 따른다. 예) 목요일 수집 완료 · 게시물 23건 확인 · 새 푸시 대상 2건 · 탭 공개 대상 6건 ·
     * 확인 필요 1건 · 비용 $0.3126 · 프롬프트 chiikawa-v2
     * 제외한 소식이 있으면 푸시·탭 공개 대상에서 빼고 "제외 N건"을 덧붙인다.
     */
    String summary(final BatchView view) {
        NewsBatch batch = view.batch();
        GrokUsage usage = batch.usage();
        String run = runLabel(batch.getRunName());
        String tail = " · 비용 $" + usage.formattedCostUsd() + " · 프롬프트 " + batch.getPromptVersion();

        if (batch.getStatus() == NewsBatchStatus.FAILED) {
            List<String> warnings = batch.warnings();
            String reason = warnings.isEmpty() ? "알 수 없음" : warnings.getLast();
            return escape(run + " 수집 실패 · 원인: " + reason + tail);
        }
        boolean partial = batch.periods().stream().anyMatch(period -> !period.collected());
        int push = activeCount(view, NewsReview.PUSH_TARGET);
        StringBuilder text = new StringBuilder(run).append(partial ? " 수집 완료 (일부 계정 실패)" : " 수집 완료");
        text.append(" · 게시물 ").append(usage.postsFetched()).append("건 확인");
        if (batch.getStatus() == NewsBatchStatus.NO_NEWS) {
            text.append(" · 새 소식 없음");
        }
        text.append(" · 새 푸시 대상 ").append(push).append("건");
        text.append(" · 탭 공개 대상 ").append(push + activeCount(view, NewsReview.TAB_ONLY)).append("건");
        text.append(" · 확인 필요 ").append(count(view, NewsReview.NEEDS_CHECK)).append("건");
        int excluded = (int) view.candidates().stream().filter(candidate -> candidate.getReview().isPublishable() && view.isExcluded(candidate)).count();
        if (excluded > 0) {
            text.append(" · 제외 ").append(excluded).append("건");
        }
        return escape(text.append(tail).toString());
    }

    /**
     * 회차 상태에 맞는 진행 표시. 승인 대기 중이면 "승인 1/2 · 누구", 첫 표 이후 제외·되돌리기가 있었다면 그 사람도 보여준다.
     */
    private @Nullable String statusLine(final BatchView view, @Nullable final String expiredLine) {
        NewsBatch batch = view.batch();
        return switch (batch.getStatus()) {
            case AWAITING_APPROVAL -> batch.isDryRun() ? null : progressLine(view);
            case APPROVED -> approvedLine(view);
            case DISCARDED -> "🔁 *다시 수집으로 버려짐* · 같은 기간을 다시 수집해 새 승인 요청을 보냅니다";
            case EXPIRED -> expiredLine != null ? expiredLine : "⏰ *만료됨*";
            default -> null;
        };
    }

    private String progressLine(final BatchView view) {
        StringBuilder line = new StringBuilder("*승인 ").append(view.approverIds().size()).append('/')
                .append(properties.requiredApprovals()).append('*');
        if (!view.approverIds().isEmpty()) {
            line.append(" · ").append(mentions(view.approverIds()));
        }
        String changedBy = view.batch().getChangedAfterVoteBy();
        if (changedBy != null) {
            line.append(" · ⚠️ 승인 후 변경 · ").append(mention(changedBy));
        }
        return line.toString();
    }

    private String approvedLine(final BatchView view) {
        StringBuilder line = new StringBuilder("✅ *승인됨* · ").append(mentions(view.approverIds()));
        LocalDateTime sendAt = view.batch().getSendAt();
        if (sendAt == null) {
            line.append(" · 탭에 공개됨");
        } else {
            LocalDateTime inZone = sendAt.atZone(ZoneId.systemDefault()).withZoneSameInstant(properties.zone()).toLocalDateTime();
            line.append(" · 발송 예정 ").append(NewsDateFormat.shortDateTime(inZone)).append(" (이때 탭에 공개)");
        }
        return line.toString();
    }

    private String mentions(final List<String> userIds) {
        return String.join(", ", userIds.stream().map(this::mention).toList());
    }

    /**
     * 슬랙 회원 ID 는 멘션으로 보여줘서 이름이 나오게 한다. 형식이 다르면 그대로 글자로 보여준다.
     */
    private String mention(final String userId) {
        return SLACK_USER_ID.matcher(userId).matches() ? "<@" + userId + ">" : escape(userId);
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
            final List<ObjectNode> blocks,
            final String heading,
            final BatchView view,
            final NewsReview review,
            final int maxLines,
            final boolean showLinkStatus
    ) {
        List<NewsCandidate> matched = view.candidates().stream()
                .filter(candidate -> candidate.getReview() == review)
                .sorted(EARLIEST_START_FIRST)
                .toList();
        if (matched.isEmpty()) {
            return;
        }
        List<String> lines = new ArrayList<>();
        matched.stream().limit(maxLines).forEach(candidate -> lines.add(candidateLine(candidate, showLinkStatus, view.isExcluded(candidate))));
        if (matched.size() > maxLines) {
            lines.add("… 외 " + (matched.size() - maxLines) + "건");
        }
        addText(blocks, "*" + heading + " " + matched.size() + "건*\n" + String.join("\n", lines));
    }

    /**
     * 승인 요청에서는 푸시 대상마다 줄 끝에 [제외] 버튼을, 이미 제외한 소식에는 [되돌리기] 버튼을 단다.
     * 슬랙은 메시지 하나에 블록 50개까지라 30건까지만 버튼을 단다.
     */
    private void addPushTargetsWithButtons(final List<ObjectNode> blocks, final BatchView view) {
        List<NewsCandidate> pushTargets = view.candidates().stream()
                .filter(candidate -> candidate.getReview() == NewsReview.PUSH_TARGET)
                .sorted(EARLIEST_START_FIRST)
                .toList();
        if (pushTargets.isEmpty()) {
            return;
        }
        addText(blocks, "*푸시 대상 " + pushTargets.size() + "건*");
        Long batchId = view.batch().getId();
        pushTargets.stream().limit(PUSH_TARGET_LINES).forEach(candidate -> {
            boolean excluded = view.isExcluded(candidate);
            ObjectNode button = excluded
                    ? button("되돌리기", ACTION_UNDO_EXCLUDE, batchId + ":" + candidate.getId(), null)
                    : button("제외", ACTION_EXCLUDE, batchId + ":" + candidate.getId(), null);
            blocks.add(sectionWithButton(candidateLine(candidate, false, excluded), button));
        });
        if (pushTargets.size() > PUSH_TARGET_LINES) {
            addText(blocks, "… 외 " + (pushTargets.size() - PUSH_TARGET_LINES) + "건 (이 소식들은 [제외]를 달지 못했습니다)");
        }
    }

    /**
     * 푸시 대상이 없으면 탭에만 공개하는 승인이고, 보낼 푸시가 없으니 테스트 발송 버튼도 달지 않는다.
     */
    private ObjectNode approvalActions(final Long batchId, final int pushTargetCount) {
        ObjectNode actions = objectMapper.createObjectNode().put("type", "actions");
        ArrayNode elements = actions.putArray("elements");
        elements.add(button(pushTargetCount > 0 ? "승인" : "승인(탭만 공개)", ACTION_APPROVE, String.valueOf(batchId), "primary"));
        elements.add(button("다시 수집", ACTION_RECOLLECT, String.valueOf(batchId), null));
        if (pushTargetCount > 0) {
            elements.add(button("나에게 테스트 발송", ACTION_TEST_SEND, String.valueOf(batchId), null));
        }
        return actions;
    }

    private ObjectNode button(final String label, final String actionId, final String value, @Nullable final String style) {
        ObjectNode button = objectMapper.createObjectNode().put("type", "button");
        button.putObject("text").put("type", "plain_text").put("text", label);
        button.put("action_id", actionId).put("value", value);
        if (style != null) {
            button.put("style", style);
        }
        return button;
    }

    private ObjectNode sectionWithButton(final String text, final ObjectNode button) {
        ObjectNode block = sectionBlock(text);
        block.set("accessory", button);
        return block;
    }

    private String candidateLine(final NewsCandidate candidate, final boolean showLinkStatus, final boolean excluded) {
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
        if (candidate.getCarriedFromId() != null) {
            line.append(" · 이월");
        }
        return excluded ? "~" + line + "~ · 제외됨" : line.toString();
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

    private void addNotes(final List<ObjectNode> blocks, final List<String> warnings) {
        if (warnings.isEmpty()) {
            return;
        }
        List<String> lines = new ArrayList<>();
        warnings.stream().limit(WARNING_LINES).forEach(warning -> lines.add("• " + escape(limit(warning, 300))));
        if (warnings.size() > WARNING_LINES) {
            lines.add("… 외 " + (warnings.size() - WARNING_LINES) + "건");
        }
        addText(blocks, "*확인할 내용*\n" + String.join("\n", lines));
    }

    /**
     * 글은 블록 하나가 3000자를 넘지 않게 줄 단위로 나눠 담는다.
     */
    private void addText(final List<ObjectNode> blocks, final String text) {
        chunk(text).forEach(chunk -> blocks.add(sectionBlock(chunk)));
    }

    /**
     * 블록이 너무 많으면 뒤쪽을 생략한다. 승인 버튼 줄은 잘리지 않게 마지막에 붙인다.
     */
    private ArrayNode toBlocks(final List<ObjectNode> content, @Nullable final ObjectNode actions) {
        ArrayNode blocks = objectMapper.createArrayNode();
        content.stream().limit(MAX_BLOCKS).forEach(blocks::add);
        if (content.size() > MAX_BLOCKS) {
            blocks.add(sectionBlock("_길이 제한으로 나머지 " + (content.size() - MAX_BLOCKS) + "개 블록은 생략했습니다._"));
        }
        if (actions != null) {
            blocks.add(actions);
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

    private int count(final BatchView view, final NewsReview review) {
        return (int) view.candidates().stream().filter(candidate -> candidate.getReview() == review).count();
    }

    /**
     * 제외한 소식을 뺀 수. 제외는 공개 대상에만 있다.
     */
    private int activeCount(final BatchView view, final NewsReview review) {
        return (int) view.candidates().stream()
                .filter(candidate -> candidate.getReview() == review && !view.isExcluded(candidate)).count();
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

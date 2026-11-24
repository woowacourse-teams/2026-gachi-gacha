package com.gachi.gacha.server.news.domain;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/**
 * 신상 소식 요약 푸시의 본문. {@code [종류 날짜] 제목 외 N건} 형식이고, 행사가 가장 빨리 시작하는 소식을 앞에 둔다.
 *
 * <pre>
 * [입장예약 11/5(목)~11/8(일)] 치이카와샵 용산점 네이버 예약 입장 안내
 * [재입고 11/5(목)~] 영화 치이카와 인기 상품 재입고 외 1건
 * [발매 진행 중 ~11/30] 연하엽서 3매 세트 외 2건
 * [발매] 신상품 발매                                  (날짜를 모르면 종류만)
 * </pre>
 */
public final class NewsPushCopy {

    private static final int MAX_TITLE_LENGTH = 60;
    private static final Comparator<NewsCandidate> EARLIEST_START_FIRST = Comparator
            .comparing(NewsCandidate::getStartDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(NewsCandidate::getId, Comparator.nullsLast(Comparator.naturalOrder()));

    private NewsPushCopy() {
    }

    /**
     * @param items 푸시에 담을 소식. 비어 있으면 안 된다
     */
    public static String body(final List<NewsCandidate> items, final LocalDate todayKst) {
        if (items.isEmpty()) {
            throw new IllegalArgumentException("푸시에 담을 소식이 없다");
        }
        List<NewsCandidate> sorted = items.stream().sorted(EARLIEST_START_FIRST).toList();
        NewsCandidate lead = sorted.getFirst();
        String date = dateText(lead, todayKst);
        StringBuilder body = new StringBuilder("[").append(lead.getKind().getLabel());
        if (!date.isEmpty()) {
            body.append(' ').append(date);
        }
        body.append("] ").append(limit(lead.getTitle()));
        if (sorted.size() > 1) {
            body.append(" 외 ").append(sorted.size() - 1).append('건');
        }
        return body.toString();
    }

    /**
     * 이미 시작한 소식은 시작일 대신 "진행 중"으로 보여주고, 끝나는 날을 알면 요일 없이 "진행 중 ~11/30"이다.
     * 아직 시작하지 않은 소식은 "11/5(목)~11/8(일)", 시작일만 알면 "11/5(목)~" 이다.
     */
    private static String dateText(final NewsCandidate candidate, final LocalDate todayKst) {
        boolean ongoing = candidate.currentTiming(todayKst).filter(timing -> timing == NewsTiming.ONGOING).isPresent();
        LocalDate start = candidate.getStartDate();
        LocalDate end = candidate.getEndDate();
        if (ongoing) {
            return end == null ? "진행 중" : "진행 중 ~" + NewsDateFormat.monthDay(end);
        }
        if (start == null) {
            return end == null ? "" : "~" + NewsDateFormat.shortDate(end);
        }
        if (end == null) {
            return NewsDateFormat.shortDate(start) + "~";
        }
        return start.equals(end) ? NewsDateFormat.shortDate(start)
                : NewsDateFormat.shortDate(start) + "~" + NewsDateFormat.shortDate(end);
    }

    private static String limit(final String title) {
        return title.length() > MAX_TITLE_LENGTH ? title.substring(0, MAX_TITLE_LENGTH - 1) + "…" : title;
    }
}

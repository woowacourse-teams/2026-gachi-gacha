package com.gachi.gacha.server.news.domain;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import org.jspecify.annotations.Nullable;

/**
 * 여러 호출의 소식을 합친 뒤 정리한다. 규칙은 수집 스크립트와 같다.
 *
 * <ol>
 *   <li>같은 게시물 중복 제거: http(s) 링크끼리 정규화한 값으로 비교하고 먼저 나온 것을 남긴다</li>
 *   <li>평소 운영시간과 같은 notes 제거 (변경·단축·연장·휴무·임시 공지는 유지)</li>
 *   <li>ref_url 의 utm 추적 파라미터 제거</li>
 *   <li>오늘(KST) 기준 진행 상태 판단, 끝난 소식 분리</li>
 * </ol>
 */
public class NewsPostProcessor {

    private static final Pattern WHITESPACE = Pattern.compile("(?U)\\s");
    private static final Pattern HOURS_CHANGE_WORDS = Pattern.compile("변경|단축|연장|휴무|임시");
    private static final Pattern UTM_PARAMETER = Pattern.compile("utm_[A-Za-z]+=[^&]*&?");
    private static final Pattern DANGLING_SEPARATOR = Pattern.compile("[?&]$");

    /**
     * @param storeHours 매장 평소 운영시간. 없으면 notes 를 지우지 않는다
     */
    public Result process(final List<CollectedNews> merged, final LocalDate todayKst, @Nullable final String storeHours) {
        List<CollectedNews> items = new ArrayList<>();
        List<CollectedNews> endedItems = new ArrayList<>();
        Set<String> keptKeys = new HashSet<>();
        int duplicateCount = 0;
        for (CollectedNews news : merged) {
            if (NewsLink.isHttp(news.link()) && !keptKeys.add(news.linkKey())) {
                duplicateCount++;
                continue;
            }
            NewsDetail detail = news.detail().withNotesAndRefUrl(
                    filterNotes(news.detail().notes(), storeHours), cleanRefUrl(news.detail().refUrl()));
            NewsTiming timing = NewsTiming.judge(
                    news.startDate(), news.endDate(), news.title(), detail.dateLabel(), todayKst);
            (timing == NewsTiming.ENDED ? endedItems : items).add(news.with(detail, timing));
        }
        return new Result(items, endedItems, duplicateCount);
    }

    private List<String> filterNotes(final List<String> notes, @Nullable final String storeHours) {
        String hours = storeHours == null ? "" : WHITESPACE.matcher(storeHours).replaceAll("");
        if (hours.isEmpty()) {
            return notes;
        }
        return notes.stream()
                .filter(note -> !isRegularHoursNotice(note, hours))
                .toList();
    }

    /**
     * 매장 정보로 이미 보여주는 평소 운영시간을 반복한 공지인지 본다. 운영시간이 바뀌는 공지는 남긴다.
     */
    private boolean isRegularHoursNotice(final String note, final String hoursWithoutSpace) {
        boolean repeatsHours = WHITESPACE.matcher(note).replaceAll("").contains(hoursWithoutSpace);
        return repeatsHours && !HOURS_CHANGE_WORDS.matcher(note).find();
    }

    private @Nullable String cleanRefUrl(@Nullable final String refUrl) {
        if (refUrl == null || refUrl.isEmpty()) {
            return null;
        }
        String withoutUtm = UTM_PARAMETER.matcher(refUrl).replaceAll("");
        return DANGLING_SEPARATOR.matcher(withoutUtm).replaceFirst("");
    }

    /**
     * @param items          끝나지 않은 소식
     * @param endedItems     이미 끝난 소식. 슬랙의 "지난 소식"에만 짧게 보여준다
     * @param duplicateCount 같은 실행 안에서 중복이라 뺀 수
     */
    public record Result(List<CollectedNews> items, List<CollectedNews> endedItems, int duplicateCount) {

        public Result {
            items = List.copyOf(items);
            endedItems = List.copyOf(endedItems);
        }

        public List<CollectedNews> all() {
            List<CollectedNews> all = new ArrayList<>(items);
            all.addAll(endedItems);
            return all;
        }
    }
}

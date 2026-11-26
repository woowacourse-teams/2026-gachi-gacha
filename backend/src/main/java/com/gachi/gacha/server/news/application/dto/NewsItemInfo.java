package com.gachi.gacha.server.news.application.dto;

import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsDetail;
import com.gachi.gacha.server.news.domain.NewsItem;
import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsSection;
import com.gachi.gacha.server.news.domain.NewsTiming;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

/**
 * 신상 소식 탭에 보여줄 소식 하나.
 *
 * @param timing 오늘(KST) 기준 진행 상태. 날짜도 종료를 뜻하는 말도 없어서 판단할 수 없으면 null
 */
@Builder
public record NewsItemInfo(
        Long itemId,
        NewsKind kind,
        NewsSection section,
        String title,
        @Nullable NewsTiming timing,
        @Nullable LocalDate startDate,
        @Nullable LocalDate endDate,
        @Nullable String dateLabel,
        @Nullable String location,
        List<NewsDetail.Product> products,
        NewsDetail.@Nullable Reservation reservation,
        List<String> notes,
        String link,
        @Nullable String refUrl,
        LocalDateTime publishedAt
) {

    public static NewsItemInfo of(final NewsItem item, final LocalDate todayKst) {
        NewsCandidate candidate = item.getCandidate();
        NewsDetail detail = candidate.detail();
        return NewsItemInfo.builder()
                .itemId(item.getId())
                .kind(candidate.getKind())
                .section(candidate.getSection())
                .title(candidate.getTitle())
                .timing(candidate.currentTiming(todayKst).orElse(null))
                .startDate(candidate.getStartDate())
                .endDate(candidate.getEndDate())
                .dateLabel(detail.dateLabel())
                .location(detail.location())
                .products(detail.products())
                .reservation(detail.reservation())
                .notes(detail.notes())
                .link(candidate.getLink())
                .refUrl(detail.refUrl())
                .publishedAt(item.getPublishedAt())
                .build();
    }

    public boolean isEnded() {
        return timing == NewsTiming.ENDED;
    }
}

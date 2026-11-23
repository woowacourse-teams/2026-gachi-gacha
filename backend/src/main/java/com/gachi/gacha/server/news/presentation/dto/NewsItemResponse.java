package com.gachi.gacha.server.news.presentation.dto;

import com.gachi.gacha.server.news.application.dto.NewsItemInfo;
import com.gachi.gacha.server.news.domain.NewsDetail;
import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsSection;
import com.gachi.gacha.server.news.domain.NewsTiming;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
@Schema(description = "신상 소식")
public record NewsItemResponse(
        @Schema(description = "소식 ID", example = "12") Long itemId,
        @Schema(description = "종류", example = "RELEASE") NewsKind kind,
        @Schema(description = "종류 표시 이름", example = "발매") String kindLabel,
        @Schema(description = "판매·배송 기준 구분", example = "KOREA_STORE") NewsSection section,
        @Schema(description = "구분 표시 이름", example = "한국 매장") String sectionLabel,
        @Schema(description = "제목", example = "치이카와샵 용산점 네이버 예약 입장 안내") String title,
        @Schema(description = "오늘 기준 진행 상태. 날짜를 몰라 판단할 수 없으면 null") @Nullable NewsTiming timing,
        @Schema(description = "행사 시작일") @Nullable LocalDate startDate,
        @Schema(description = "행사 종료일") @Nullable LocalDate endDate,
        @Schema(description = "사람이 읽는 날짜 표기", example = "11/5(목) ~ 11/8(일)") @Nullable String dateLabel,
        @Schema(description = "장소·판매처", example = "치이카와샵 용산점") @Nullable String location,
        @Schema(description = "상품 목록") List<NewsDetail.Product> products,
        @Schema(description = "예약·입장 방식") NewsDetail.@Nullable Reservation reservation,
        @Schema(description = "운영 공지") List<String> notes,
        @Schema(description = "근거 게시물 링크") String link,
        @Schema(description = "예약·상품 페이지 링크") @Nullable String refUrl,
        @Schema(description = "공개 시각") LocalDateTime publishedAt
) {
    public static NewsItemResponse from(final NewsItemInfo info) {
        return NewsItemResponse.builder()
                .itemId(info.itemId())
                .kind(info.kind())
                .kindLabel(info.kind().getLabel())
                .section(info.section())
                .sectionLabel(info.section().getLabel())
                .title(info.title())
                .timing(info.timing())
                .startDate(info.startDate())
                .endDate(info.endDate())
                .dateLabel(info.dateLabel())
                .location(info.location())
                .products(info.products())
                .reservation(info.reservation())
                .notes(info.notes())
                .link(info.link())
                .refUrl(info.refUrl())
                .publishedAt(info.publishedAt())
                .build();
    }
}

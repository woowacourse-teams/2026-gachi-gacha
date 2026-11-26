package com.gachi.gacha.server.news.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Objects;
import java.util.Optional;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.jspecify.annotations.Nullable;

/**
 * 회차에서 수집한 후보 소식. 소식 내용은 이 테이블에만 저장하고, 공개된 소식은 이 행을 참조한다.
 * 그래서 후보 행은 지우지 않는다.
 */
@Getter
@Entity
@Table(name = "news_candidate")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NewsCandidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long batchId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NewsSection section;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NewsKind kind;

    @Column(nullable = false)
    private String title;

    private LocalDate startDate;

    private LocalDate endDate;

    private String link;

    private LocalDateTime postedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NewsReview review;

    /**
     * 이전 회차에서 넘겨받은 후보면 처음 수집한 후보의 ID. 슬랙에 "이월"로 보여준다.
     */
    private Long carriedFromId;

    @Getter(AccessLevel.NONE)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private String detail;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private NewsCandidate(
            final Long batchId,
            final NewsSection section,
            final NewsKind kind,
            final String title,
            @Nullable final LocalDate startDate,
            @Nullable final LocalDate endDate,
            @Nullable final String link,
            @Nullable final LocalDateTime postedAt,
            final NewsReview review,
            @Nullable final Long carriedFromId,
            final String detail
    ) {
        this.batchId = Objects.requireNonNull(batchId, "batchId");
        this.section = Objects.requireNonNull(section, "section");
        this.kind = Objects.requireNonNull(kind, "kind");
        this.title = Objects.requireNonNull(title, "title");
        this.startDate = startDate;
        this.endDate = endDate;
        this.link = link;
        this.postedAt = postedAt;
        this.review = Objects.requireNonNull(review, "review");
        this.carriedFromId = carriedFromId;
        this.detail = Objects.requireNonNull(detail, "detail");
    }

    /**
     * 원본 게시 시각은 다른 시각 컬럼과 같이 서버 기본 시간대로 저장한다.
     */
    public static NewsCandidate collected(final Long batchId, final CollectedNews news) {
        LocalDateTime postedAt = news.postedAt()
                .map(instant -> LocalDateTime.ofInstant(instant, ZoneId.systemDefault()))
                .orElse(null);
        return new NewsCandidate(batchId, news.section(), news.kind(), news.title(),
                news.startDate(), news.endDate(), news.link(), postedAt, news.review(), null,
                NewsJsonCodec.writeDetail(news.detail()));
    }

    /**
     * 승인되지 않고 만료된 회차의 후보를 다음 회차로 옮길 수 있는지.
     * 링크가 검증된 공개 대상이고 아직 끝나지 않았을 때만 옮긴다. 공개 여부와 제외 기록은 저장소를 봐야 해서 호출하는 쪽이 확인한다.
     */
    public boolean isCarryOverEligible(final LocalDate todayKst) {
        return review.isPublishable() && !isEndedOn(todayKst);
    }

    public NewsCandidate carryTo(final Long newBatchId) {
        return new NewsCandidate(newBatchId, section, kind, title, startDate, endDate, link, postedAt, review,
                carriedFromId == null ? id : carriedFromId, detail);
    }

    /**
     * 수집 뒤 시간이 지나 그 사이에 끝난 소식인지. 이월·공개 시점에 다시 판단할 때 쓴다.
     */
    public boolean isEndedOn(final LocalDate todayKst) {
        return currentTiming(todayKst).filter(timing -> timing == NewsTiming.ENDED).isPresent();
    }

    public Optional<NewsTiming> currentTiming(final LocalDate todayKst) {
        return Optional.ofNullable(NewsTiming.judge(startDate, endDate, title, detail().dateLabel(), todayKst));
    }

    public boolean isPushTarget() {
        return review == NewsReview.PUSH_TARGET;
    }

    /**
     * 같은 소식인지 판단하는 값. X 게시물은 게시물 번호다.
     */
    public String linkKey() {
        return NewsLink.normalize(link);
    }

    public NewsDetail detail() {
        return NewsJsonCodec.readDetail(detail);
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

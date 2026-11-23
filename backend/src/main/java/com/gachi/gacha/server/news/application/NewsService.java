package com.gachi.gacha.server.news.application;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidPageRequestException;
import com.gachi.gacha.server.news.application.dto.NewsItemInfo;
import com.gachi.gacha.server.news.application.dto.NewsPageInfo;
import com.gachi.gacha.server.news.domain.NewsItem;
import com.gachi.gacha.server.news.domain.NewsItemJpaRepository;
import com.gachi.gacha.server.news.domain.NewsMemberTopic;
import com.gachi.gacha.server.news.domain.NewsMemberTopicJpaRepository;
import com.gachi.gacha.server.news.domain.exception.NewsTopicNotFoundException;
import com.gachi.gacha.server.news.infra.NewsProperties;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 앱의 신상 소식 탭: 소식 목록, 새 소식 표시, 구독. 알림 목록({@code Notification})과는 데이터도 API 도 따로 둔다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NewsService {

    private static final int MAX_PAGE_SIZE = 100;

    private static final Comparator<NewsItemInfo> ACTIVE_ORDER = Comparator
            .comparing(NewsItemInfo::startDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(NewsItemInfo::publishedAt, Comparator.reverseOrder())
            .thenComparing(NewsItemInfo::itemId, Comparator.reverseOrder());
    private static final Comparator<NewsItemInfo> ENDED_ORDER = Comparator
            .comparing(NewsItemInfo::endDate, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(NewsItemInfo::publishedAt, Comparator.reverseOrder())
            .thenComparing(NewsItemInfo::itemId, Comparator.reverseOrder());

    /**
     * 끝나지 않은 소식을 위에 행사 시작이 빠른 순으로, 끝난 소식은 아래에 최근에 끝난 순으로 둔다.
     * 같으면 최근에 공개한 소식이 먼저다.
     */
    static final Comparator<NewsItemInfo> DISPLAY_ORDER = (left, right) -> {
        if (left.isEnded() != right.isEnded()) {
            return left.isEnded() ? 1 : -1;
        }
        return left.isEnded() ? ENDED_ORDER.compare(left, right) : ACTIVE_ORDER.compare(left, right);
    };

    private final NewsItemJpaRepository itemRepository;
    private final NewsMemberTopicJpaRepository memberTopicRepository;
    private final NewsProperties properties;
    private final Clock clock;

    public NewsPageInfo getItems(final String topic, final int page, final int size) {
        requireTopic(topic);
        if (page < 0 || size <= 0 || size > MAX_PAGE_SIZE) {
            throw new InvalidPageRequestException(ErrorCode.INVALID_PAGE_REQUEST);
        }
        LocalDate today = todayKst();
        List<NewsItemInfo> sorted = findVisible(topic).stream()
                .map(item -> NewsItemInfo.of(item, today))
                .sorted(DISPLAY_ORDER)
                .toList();
        long from = (long) page * size;
        if (from >= sorted.size()) {
            return new NewsPageInfo(List.of(), false);
        }
        int end = (int) Math.min(from + size, sorted.size());
        return new NewsPageInfo(sorted.subList((int) from, end), end < sorted.size());
    }

    /**
     * 마지막으로 탭을 본 뒤에 공개된 소식이 있는지. 탭을 본 적이 없으면 보이는 소식이 하나라도 있으면 있다.
     */
    public boolean hasNew(final Long memberId, final String topic) {
        requireTopic(topic);
        LocalDateTime lastViewedAt = memberTopicRepository.findByMemberIdAndTopic(memberId, topic)
                .map(NewsMemberTopic::getLastViewedAt)
                .orElse(null);
        return findVisible(topic).stream()
                .anyMatch(item -> lastViewedAt == null || item.getPublishedAt().isAfter(lastViewedAt));
    }

    @Transactional
    public void markViewed(final Long memberId, final String topic) {
        requireTopic(topic);
        findOrCreate(memberId, topic).view(LocalDateTime.now(clock));
    }

    public boolean isSubscribed(final Long memberId, final String topic) {
        requireTopic(topic);
        return memberTopicRepository.findByMemberIdAndTopic(memberId, topic)
                .map(NewsMemberTopic::isSubscribed)
                .orElse(false);
    }

    /**
     * 구독을 켜거나 끈다. 이미 그 상태면 아무것도 바꾸지 않는다. 구독한 적이 없는 회원이 끄면 행을 만들지 않는다.
     */
    @Transactional
    public boolean setSubscribed(final Long memberId, final String topic, final boolean subscribed) {
        requireTopic(topic);
        LocalDateTime now = LocalDateTime.now(clock);
        if (subscribed) {
            findOrCreate(memberId, topic).subscribe(now);
            return true;
        }
        memberTopicRepository.findByMemberIdAndTopic(memberId, topic).ifPresent(memberTopic -> memberTopic.unsubscribe(now));
        return false;
    }

    private NewsMemberTopic findOrCreate(final Long memberId, final String topic) {
        memberTopicRepository.insertIfAbsent(memberId, topic, LocalDateTime.now(clock));
        return memberTopicRepository.findByMemberIdAndTopic(memberId, topic)
                .orElseThrow(() -> new IllegalStateException("회원 주제 설정을 만들지 못했다: " + memberId + " " + topic));
    }

    private List<NewsItem> findVisible(final String topic) {
        LocalDate hideBefore = todayKst().minusDays(properties.hideEndedAfterDays());
        return itemRepository.findVisible(topic, LocalDateTime.now(clock), hideBefore, hideBefore.atStartOfDay());
    }

    private void requireTopic(final String topic) {
        if (properties.topic(topic).isEmpty()) {
            throw new NewsTopicNotFoundException();
        }
    }

    private LocalDate todayKst() {
        return LocalDate.now(clock.withZone(properties.zone()));
    }
}

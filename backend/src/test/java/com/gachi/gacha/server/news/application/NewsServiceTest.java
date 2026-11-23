package com.gachi.gacha.server.news.application;

import static com.gachi.gacha.server.news.domain.NewsFixtures.news;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;

import com.gachi.gacha.server.common.exception.InvalidPageRequestException;
import com.gachi.gacha.server.news.application.dto.NewsItemInfo;
import com.gachi.gacha.server.news.application.dto.NewsPageInfo;
import com.gachi.gacha.server.news.domain.NewsCandidate;
import com.gachi.gacha.server.news.domain.NewsFixtures;
import com.gachi.gacha.server.news.domain.NewsItem;
import com.gachi.gacha.server.news.domain.NewsItemJpaRepository;
import com.gachi.gacha.server.news.domain.NewsKind;
import com.gachi.gacha.server.news.domain.NewsMemberTopic;
import com.gachi.gacha.server.news.domain.NewsMemberTopicJpaRepository;
import com.gachi.gacha.server.news.domain.NewsSection;
import com.gachi.gacha.server.news.domain.NewsTiming;
import com.gachi.gacha.server.news.domain.exception.NewsTopicNotFoundException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * DB 없이 목록 정렬·진행 상태·페이징, 새 소식 판단, 구독 규칙을 확인한다. 숨기는 기준 쿼리는 NewsItemJpaRepositoryTest 가 확인한다.
 */
class NewsServiceTest {

    private static final String TOPIC = "CHIIKAWA";
    private static final long MEMBER_ID = 1L;
    /**
     * 서버 시간대와 KST 가 같은 날짜인 시각. 오늘은 2026-11-12(목)이다.
     */
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-12T03:30:00Z"), ZoneOffset.UTC);
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 12);
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 12, 3, 30);

    private final NewsItemJpaRepository itemRepository = mock(NewsItemJpaRepository.class);
    private final NewsMemberTopicJpaRepository memberTopicRepository = mock(NewsMemberTopicJpaRepository.class);
    private final NewsService service = new NewsService(itemRepository, memberTopicRepository,
            NewsFixtures.properties(false, "", 40, 0.6), CLOCK);
    private final List<NewsItem> visible = new ArrayList<>();

    @BeforeEach
    void setUp() {
        given(itemRepository.findVisible(eq(TOPIC), any(), any(), any())).willReturn(visible);
    }

    @Nested
    @DisplayName("목록")
    class Items {

        @Test
        @DisplayName("끝나지 않은 소식은 행사 시작이 빠른 순으로 위에, 날짜 없는 소식은 그 뒤에, 끝난 소식은 최근에 끝난 순으로 아래에 둔다")
        void sortsActiveThenEnded() {
            visible.addAll(List.of(
                    item(1, "예정 11/20", LocalDate.of(2026, 11, 20), null, at(11, 10, 9)),
                    item(2, "예정 11/13", LocalDate.of(2026, 11, 13), null, at(11, 11, 9)),
                    item(3, "진행 중 11/1~11/30", LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30), at(11, 2, 9)),
                    item(4, "날짜 없음 오래됨", null, null, at(11, 3, 9)),
                    item(5, "날짜 없음 최근", null, null, at(11, 11, 15)),
                    item(6, "끝남 11/8", LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 8), at(11, 5, 9)),
                    item(7, "끝남 11/10", LocalDate.of(2026, 11, 9), LocalDate.of(2026, 11, 10), at(11, 9, 9))));

            NewsPageInfo page = service.getItems(TOPIC, 0, 20);

            assertThat(page.items()).extracting(NewsItemInfo::title).containsExactly(
                    "진행 중 11/1~11/30", "예정 11/13", "예정 11/20", "날짜 없음 최근", "날짜 없음 오래됨", "끝남 11/10", "끝남 11/8");
            assertThat(page.hasNext()).isFalse();
        }

        @Test
        @DisplayName("진행 상태는 오늘(KST) 기준으로 판단해서 예정, 진행 중, 종료로 보여주고, 판단할 수 없으면 비워 둔다")
        void showsTimingBasedOnToday() {
            visible.addAll(List.of(
                    item(1, "예정", LocalDate.of(2026, 11, 20), null, at(11, 10, 9)),
                    item(2, "진행 중", LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30), at(11, 10, 9)),
                    item(3, "시작일만 지남", LocalDate.of(2026, 11, 5), null, at(11, 10, 9)),
                    item(4, "종료", LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 8), at(11, 10, 9)),
                    item(5, "날짜 없음", null, null, at(11, 10, 9))));

            List<NewsItemInfo> items = service.getItems(TOPIC, 0, 20).items();

            assertThat(items).extracting(NewsItemInfo::title, NewsItemInfo::timing).containsExactlyInAnyOrder(
                    org.assertj.core.api.Assertions.tuple("예정", NewsTiming.UPCOMING),
                    org.assertj.core.api.Assertions.tuple("진행 중", NewsTiming.ONGOING),
                    org.assertj.core.api.Assertions.tuple("시작일만 지남", NewsTiming.ONGOING),
                    org.assertj.core.api.Assertions.tuple("종료", NewsTiming.ENDED),
                    org.assertj.core.api.Assertions.tuple("날짜 없음", null));
        }

        @Test
        @DisplayName("소식 내용(종류, 구분, 상품, 장소, 링크)을 그대로 돌려준다")
        void mapsContent() {
            visible.add(item(1, "용산점 입고", LocalDate.of(2026, 11, 13), null, at(11, 10, 9)));

            NewsItemInfo info = service.getItems(TOPIC, 0, 20).items().getFirst();

            assertThat(info.itemId()).isEqualTo(1L);
            assertThat(info.kind()).isEqualTo(NewsKind.RELEASE);
            assertThat(info.section()).isEqualTo(NewsSection.KOREA_STORE);
            assertThat(info.location()).isEqualTo("치이카와샵 용산점");
            assertThat(info.products()).extracting("name").containsExactly("앉은 인형");
            assertThat(info.link()).isEqualTo("https://x.com/a/status/1");
            assertThat(info.publishedAt()).isEqualTo(at(11, 10, 9));
        }

        @Test
        @DisplayName("페이지로 나누고, 다음 페이지가 있는지와 범위를 넘은 요청을 알려준다")
        void pagesItems() {
            for (int index = 1; index <= 5; index++) {
                visible.add(item(index, "소식 " + index, LocalDate.of(2026, 11, 12 + index), null, at(11, 10, 9)));
            }

            NewsPageInfo first = service.getItems(TOPIC, 0, 2);
            NewsPageInfo last = service.getItems(TOPIC, 2, 2);
            NewsPageInfo beyond = service.getItems(TOPIC, 3, 2);

            assertThat(first.items()).extracting(NewsItemInfo::title).containsExactly("소식 1", "소식 2");
            assertThat(first.hasNext()).isTrue();
            assertThat(last.items()).extracting(NewsItemInfo::title).containsExactly("소식 5");
            assertThat(last.hasNext()).isFalse();
            assertThat(beyond.items()).isEmpty();
            assertThat(beyond.hasNext()).isFalse();
        }

        @Test
        @DisplayName("끝난 지 30일이 지난 소식을 거르는 기준일(오늘 - 30일)과 지금 시각을 저장소에 넘긴다")
        void passesHideThresholdToRepository() {
            service.getItems(TOPIC, 0, 20);

            then(itemRepository).should().findVisible(TOPIC, NOW, LocalDate.of(2026, 10, 13),
                    LocalDate.of(2026, 10, 13).atStartOfDay());
        }

        @Test
        @DisplayName("페이지 번호나 크기가 범위를 벗어나면 막고, 없는 주제는 찾을 수 없다")
        void rejectsInvalidRequests() {
            assertThatThrownBy(() -> service.getItems(TOPIC, -1, 20)).isInstanceOf(InvalidPageRequestException.class);
            assertThatThrownBy(() -> service.getItems(TOPIC, 0, 0)).isInstanceOf(InvalidPageRequestException.class);
            assertThatThrownBy(() -> service.getItems(TOPIC, 0, 101)).isInstanceOf(InvalidPageRequestException.class);
            assertThatThrownBy(() -> service.getItems("UNKNOWN", 0, 20)).isInstanceOf(NewsTopicNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("새 소식 표시")
    class HasNew {

        @Test
        @DisplayName("탭을 본 적이 없으면 보이는 소식이 있을 때만 새 소식이 있다")
        void neverViewed() {
            assertThat(service.hasNew(MEMBER_ID, TOPIC)).isFalse();

            visible.add(item(1, "소식", null, null, at(11, 10, 9)));

            assertThat(service.hasNew(MEMBER_ID, TOPIC)).isTrue();
        }

        @Test
        @DisplayName("마지막으로 탭을 본 뒤에 공개된 소식이 있으면 새 소식이 있고, 그렇지 않으면 없다")
        void comparesWithLastViewedAt() {
            visible.add(item(1, "소식", null, null, at(11, 10, 9)));
            given(memberTopicRepository.findByMemberIdAndTopic(MEMBER_ID, TOPIC))
                    .willReturn(Optional.of(viewedAt(at(11, 10, 8))))
                    .willReturn(Optional.of(viewedAt(at(11, 10, 9))))
                    .willReturn(Optional.of(viewedAt(at(11, 11, 0))))
                    .willReturn(Optional.of(NewsMemberTopic.of(MEMBER_ID, TOPIC)));

            assertThat(service.hasNew(MEMBER_ID, TOPIC)).isTrue();
            assertThat(service.hasNew(MEMBER_ID, TOPIC)).isFalse();
            assertThat(service.hasNew(MEMBER_ID, TOPIC)).isFalse();
            assertThat(service.hasNew(MEMBER_ID, TOPIC)).isTrue();
        }

        @Test
        @DisplayName("탭을 봤다고 기록하면 지금 시각을 남기고, 행이 없으면 만든다")
        void marksViewed() {
            NewsMemberTopic memberTopic = NewsMemberTopic.of(MEMBER_ID, TOPIC);
            given(memberTopicRepository.findByMemberIdAndTopic(MEMBER_ID, TOPIC)).willReturn(Optional.of(memberTopic));

            service.markViewed(MEMBER_ID, TOPIC);

            then(memberTopicRepository).should().insertIfAbsent(MEMBER_ID, TOPIC, NOW);
            assertThat(memberTopic.getLastViewedAt()).isEqualTo(NOW);
        }
    }

    @Nested
    @DisplayName("구독")
    class Subscription {

        @Test
        @DisplayName("기본값은 구독하지 않음이다")
        void defaultsToFalse() {
            assertThat(service.isSubscribed(MEMBER_ID, TOPIC)).isFalse();
        }

        @Test
        @DisplayName("켜면 행을 만들고 구독 시각을 남긴다")
        void subscribes() {
            NewsMemberTopic memberTopic = NewsMemberTopic.of(MEMBER_ID, TOPIC);
            given(memberTopicRepository.findByMemberIdAndTopic(MEMBER_ID, TOPIC)).willReturn(Optional.of(memberTopic));

            boolean result = service.setSubscribed(MEMBER_ID, TOPIC, true);

            assertThat(result).isTrue();
            assertThat(memberTopic.isSubscribed()).isTrue();
            assertThat(memberTopic.getSubscribedAt()).isEqualTo(NOW);
            then(memberTopicRepository).should().insertIfAbsent(MEMBER_ID, TOPIC, NOW);
        }

        @Test
        @DisplayName("끄면 행은 남기고 끈 시각을 기록한다")
        void unsubscribesAndKeepsRecord() {
            NewsMemberTopic memberTopic = NewsMemberTopic.of(MEMBER_ID, TOPIC);
            memberTopic.subscribe(NOW.minusDays(3));
            given(memberTopicRepository.findByMemberIdAndTopic(MEMBER_ID, TOPIC)).willReturn(Optional.of(memberTopic));

            boolean result = service.setSubscribed(MEMBER_ID, TOPIC, false);

            assertThat(result).isFalse();
            assertThat(memberTopic.isSubscribed()).isFalse();
            assertThat(memberTopic.getUnsubscribedAt()).isEqualTo(NOW);
            then(memberTopicRepository).should(never()).delete(any());
        }

        @Test
        @DisplayName("구독한 적이 없는 회원이 끄면 행을 만들지 않는다")
        void unsubscribeWithoutRowDoesNothing() {
            boolean result = service.setSubscribed(MEMBER_ID, TOPIC, false);

            assertThat(result).isFalse();
            then(memberTopicRepository).should(never()).insertIfAbsent(any(), any(), any());
        }

        @Test
        @DisplayName("없는 주제는 구독할 수 없다")
        void rejectsUnknownTopic() {
            assertThatThrownBy(() -> service.setSubscribed(MEMBER_ID, "UNKNOWN", true))
                    .isInstanceOf(NewsTopicNotFoundException.class);
            assertThatThrownBy(() -> service.hasNew(MEMBER_ID, "UNKNOWN")).isInstanceOf(NewsTopicNotFoundException.class);
            assertThatThrownBy(() -> service.markViewed(MEMBER_ID, "UNKNOWN")).isInstanceOf(NewsTopicNotFoundException.class);
        }
    }

    private LocalDateTime at(final int month, final int day, final int hour) {
        return LocalDateTime.of(2026, month, day, hour, 0);
    }

    private NewsMemberTopic viewedAt(final LocalDateTime viewedAt) {
        NewsMemberTopic memberTopic = NewsMemberTopic.of(MEMBER_ID, TOPIC);
        memberTopic.view(viewedAt);
        return memberTopic;
    }

    private NewsItem item(
            final long id,
            final String title,
            @Nullable final LocalDate start,
            @Nullable final LocalDate end,
            final LocalDateTime publishedAt
    ) {
        NewsTiming timing = NewsTiming.judge(start, end, title, null, TODAY);
        NewsCandidate candidate = NewsCandidate.collected(1L, news(NewsSection.KOREA_STORE, NewsKind.RELEASE, title, start, end,
                "https://x.com/a/status/" + id, true, timing == NewsTiming.ENDED ? NewsTiming.UPCOMING : timing));
        ReflectionTestUtils.setField(candidate, "id", id);
        NewsItem item = NewsItem.publish(TOPIC, candidate, publishedAt);
        ReflectionTestUtils.setField(item, "id", id);
        return item;
    }
}

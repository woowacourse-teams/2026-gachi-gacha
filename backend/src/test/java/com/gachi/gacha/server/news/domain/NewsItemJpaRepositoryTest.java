package com.gachi.gacha.server.news.domain;

import static com.gachi.gacha.server.news.domain.NewsFixtures.news;
import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.notification.domain.PushPlatform;
import com.gachi.gacha.server.notification.domain.PushToken;
import com.gachi.gacha.server.notification.domain.PushTokenJpaRepository;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * V31 마이그레이션과 엔티티 매핑, 목록에서 숨기는 기준 쿼리, 회원 주제 설정 만들기를 실제 PostgreSQL 에서 확인한다.
 */
@SpringBootTest
@Transactional
class NewsItemJpaRepositoryTest {

    private static final String TOPIC = "CHIIKAWA";
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 12);
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 12, 12, 30);
    /**
     * 끝난 지 30일이 지난 소식을 숨기는 기준일. 이 날짜에 끝난 소식은 보이고, 하루 일찍 끝난 소식은 숨는다.
     */
    private static final LocalDate HIDE_BEFORE = TODAY.minusDays(30);

    @Autowired
    private NewsItemJpaRepository itemRepository;

    @Autowired
    private NewsMemberTopicJpaRepository memberTopicRepository;

    @Autowired
    private NewsBatchJpaRepository batchRepository;

    @Autowired
    private NewsCandidateJpaRepository candidateRepository;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private PushTokenJpaRepository pushTokenRepository;

    @Autowired
    private EntityManager entityManager;

    private Long batchId;
    private int sequence;

    @BeforeEach
    void setUp() {
        batchId = batchRepository.saveAndFlush(NewsBatch.start(TOPIC, "THURSDAY",
                List.of(CollectPeriod.notCollected("chiikawashop_kr", TODAY.minusDays(7), TODAY)), false, "chiikawa-v2")).getId();
    }

    @Test
    @DisplayName("공개 시각이 지난 소식만 보이고, 소식 내용(후보)도 함께 읽는다")
    void showsOnlyPublishedItems() {
        NewsItem published = save(TOPIC, "공개됨", TODAY.plusDays(1), null, NOW.minusMinutes(1));
        save(TOPIC, "공개 예정", TODAY.plusDays(1), null, NOW.plusMinutes(1));
        entityManager.flush();
        entityManager.clear();

        List<NewsItem> items = visible(TOPIC);

        assertThat(items).extracting(NewsItem::getId).containsExactly(published.getId());
        assertThat(items.getFirst().getCandidate().getTitle()).isEqualTo("공개됨");
        assertThat(items.getFirst().getCandidate().detail().location()).isEqualTo("치이카와샵 용산점");
    }

    @Test
    @DisplayName("종료일이 있으면 기준일에 끝난 소식까지 보이고, 하루라도 일찍 끝났으면 숨긴다")
    void hidesByEndDate() {
        save(TOPIC, "기준일에 끝남", null, HIDE_BEFORE, NOW.minusDays(40));
        save(TOPIC, "하루 일찍 끝남", null, HIDE_BEFORE.minusDays(1), NOW.minusDays(40));
        save(TOPIC, "진행 중", TODAY.minusDays(40), TODAY.plusDays(5), NOW.minusDays(40));
        entityManager.flush();
        entityManager.clear();

        assertThat(visible(TOPIC)).extracting(item -> item.getCandidate().getTitle())
                .containsExactlyInAnyOrder("기준일에 끝남", "진행 중");
    }

    @Test
    @DisplayName("종료일이 없으면 시작일, 둘 다 없으면 공개 시각을 같은 기준으로 본다")
    void hidesByStartDateOrPublishedAt() {
        save(TOPIC, "시작일만 최근", TODAY.minusDays(10), null, NOW.minusDays(40));
        save(TOPIC, "시작일만 오래됨", HIDE_BEFORE.minusDays(1), null, NOW.minusDays(1));
        save(TOPIC, "날짜 없음 최근 공개", null, null, NOW.minusDays(5));
        save(TOPIC, "날짜 없음 오래전 공개", null, null, HIDE_BEFORE.atStartOfDay().minusMinutes(1));
        save(TOPIC, "날짜 없음 기준 시각에 공개", null, null, HIDE_BEFORE.atStartOfDay());
        entityManager.flush();
        entityManager.clear();

        assertThat(visible(TOPIC)).extracting(item -> item.getCandidate().getTitle())
                .containsExactlyInAnyOrder("시작일만 최근", "날짜 없음 최근 공개", "날짜 없음 기준 시각에 공개");
    }

    @Test
    @DisplayName("다른 주제의 소식은 섞이지 않는다")
    void filtersByTopic() {
        save(TOPIC, "치이카와", null, null, NOW.minusDays(1));
        save("OTHER_TOPIC", "다른 주제", null, null, NOW.minusDays(1));
        entityManager.flush();
        entityManager.clear();

        assertThat(visible(TOPIC)).extracting(item -> item.getCandidate().getTitle()).containsExactly("치이카와");
        assertThat(visible("OTHER_TOPIC")).hasSize(1);
    }

    @Test
    @DisplayName("회원 주제 설정은 같은 회원·주제에 한 번만 만들고, 이미 있으면 건드리지 않는다")
    void insertsMemberTopicOnce() {
        Long memberId = memberJpaRepository.save(Member.builder()
                .oauthId(new OauthId("news" + UUID.randomUUID(), OauthProviderType.KAKAO))
                .oauthUsername("news-oauth")
                .nickname("news-member")
                .build()).getId();

        memberTopicRepository.insertIfAbsent(memberId, TOPIC, NOW);
        NewsMemberTopic created = memberTopicRepository.findByMemberIdAndTopic(memberId, TOPIC).orElseThrow();
        created.subscribe(NOW);
        entityManager.flush();
        memberTopicRepository.insertIfAbsent(memberId, TOPIC, NOW.plusDays(1));
        entityManager.clear();

        List<NewsMemberTopic> rows = memberTopicRepository.findAll().stream()
                .filter(row -> row.getMemberId().equals(memberId)).toList();
        assertThat(rows).singleElement().satisfies(row -> {
            assertThat(row.isSubscribed()).isTrue();
            assertThat(row.getSubscribedAt()).isEqualTo(NOW);
            assertThat(row.getCreatedAt()).isNotNull();
        });
    }

    @Test
    @DisplayName("구독 중인 회원만 푸시 수신 대상으로 찾고, 그 회원들의 기기 토큰을 모두 읽는다")
    void findsSubscribedMembersAndTheirTokens() {
        Long subscriber = newMember();
        Long unsubscribed = newMember();
        Long notYet = newMember();
        subscribe(subscriber, true);
        subscribe(unsubscribed, false);
        pushTokenRepository.save(PushToken.of(subscriber, "token-a", PushPlatform.ANDROID));
        pushTokenRepository.save(PushToken.of(subscriber, "token-b", PushPlatform.IOS));
        pushTokenRepository.save(PushToken.of(unsubscribed, "token-c", PushPlatform.ANDROID));
        entityManager.flush();
        entityManager.clear();

        List<Long> subscribed = memberTopicRepository.findSubscribedMemberIds(TOPIC);

        assertThat(subscribed).contains(subscriber).doesNotContain(unsubscribed, notYet);
        assertThat(pushTokenRepository.findAllByMemberIdIn(List.of(subscriber, notYet))).extracting(PushToken::getToken)
                .containsExactlyInAnyOrder("token-a", "token-b");
        assertThat(memberTopicRepository.findSubscribedMemberIds("OTHER_TOPIC")).doesNotContain(subscriber);
    }

    @Test
    @DisplayName("한 회차에서 공개한 소식만 후보와 함께 읽는다")
    void findsItemsOfBatch() {
        NewsItem inBatch = save(TOPIC, "이 회차 소식", null, null, NOW.minusDays(1));
        NewsBatch other = batchRepository.saveAndFlush(NewsBatch.start("OTHER_TOPIC", "THURSDAY",
                List.of(CollectPeriod.notCollected("chiikawashop_kr", TODAY.minusDays(7), TODAY)), false, "chiikawa-v2"));
        NewsCandidate otherCandidate = candidateRepository.save(NewsCandidate.collected(other.getId(), news(NewsSection.KOREA_STORE,
                NewsKind.RELEASE, "다른 회차 소식", null, null, "https://x.com/a/status/999", true, null)));
        itemRepository.save(NewsItem.publish("OTHER_TOPIC", otherCandidate, NOW.minusDays(1)));
        entityManager.flush();
        entityManager.clear();

        assertThat(itemRepository.findAllByBatchId(batchId)).extracting(NewsItem::getId).containsExactly(inBatch.getId());
        assertThat(itemRepository.findAllByBatchId(batchId).getFirst().getCandidate().getTitle()).isEqualTo("이 회차 소식");
    }

    private Long newMember() {
        return memberJpaRepository.save(Member.builder()
                .oauthId(new OauthId("news" + UUID.randomUUID(), OauthProviderType.KAKAO))
                .oauthUsername("news-oauth")
                .nickname("news-member")
                .build()).getId();
    }

    private void subscribe(final Long memberId, final boolean on) {
        NewsMemberTopic topic = memberTopicRepository.save(NewsMemberTopic.of(memberId, TOPIC));
        if (on) {
            topic.subscribe(NOW);
        }
    }

    private List<NewsItem> visible(final String topic) {
        return itemRepository.findVisible(topic, NOW, HIDE_BEFORE, HIDE_BEFORE.atStartOfDay());
    }

    private NewsItem save(
            final String topic,
            final String title,
            @Nullable final LocalDate start,
            @Nullable final LocalDate end,
            final LocalDateTime publishedAt
    ) {
        sequence++;
        NewsCandidate candidate = candidateRepository.save(NewsCandidate.collected(batchId, news(NewsSection.KOREA_STORE,
                NewsKind.RELEASE, title, start, end, "https://x.com/a/status/" + (1000 + sequence), true, null)));
        return itemRepository.save(NewsItem.publish(topic, candidate, publishedAt));
    }
}

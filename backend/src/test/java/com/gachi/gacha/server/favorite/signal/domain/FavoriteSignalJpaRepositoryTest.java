package com.gachi.gacha.server.favorite.signal.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import com.gachi.gacha.server.favorite.signal.domain.FavoriteSignalJpaRepository.MemberSignalScore;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class FavoriteSignalJpaRepositoryTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 15, 0, 0);
    private static final double HALF_LIFE_DAYS = 30.0;
    private static final String KEYWORD = SignalType.KEYWORD.name();

    @Autowired
    private FavoriteSignalJpaRepository repository;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("신호를 저장해도 created_at은 찜한 시각이 유지되고 updated_at은 채워진다")
    void save_keepsFavoriteAtAsCreatedAt() {
        Member member = memberJpaRepository.saveAndFlush(Member.builder()
                // 다른 테스트에서 회원을 만드는 방식 그대로 필수 필드를 채우세요
                .oauthId(new OauthId("test", OauthProviderType.KAKAO))
                .nickname("tester")
                .build());
        LocalDateTime favoriteAt = LocalDateTime.of(2026, 1, 1, 0, 0);

        repository.saveAndFlush(FavoriteSignal.of(
                member.getId(), FavoriteType.TRADE, 10L, SignalType.KEYWORD, "치이카와", 1.0, favoriteAt));

        Map<String, Object> row = jdbcTemplate.queryForMap(
                "select created_at, updated_at from favorite_signal where member_id = ? and target_id = ?",
                member.getId(), 10L);

        assertThat(((Timestamp) row.get("created_at")).toLocalDateTime()).isEqualTo(favoriteAt);
        assertThat(row.get("updated_at")).isNotNull();
    }

    @ParameterizedTest(name = "{0}일 전에 찜하면 점수는 {1}")
    @CsvSource({
            "0,   1.0",
            "30,  0.5",
            "60,  0.25",
            "15,  0.70710678",   // 0.5^0.5
            "-5,  1.0"           // 미래 시각은 감쇠 없이 weight 그대로
    })
    @DisplayName("점수는 찜한 시각 기준으로 반감기마다 절반이 된다")
    void findMemberScores_decaysByHalfLife(final long daysAgo, final double expected) {
        Member member = saveMember("decay-user", "oauth-decay");
        saveSignal(member.getId(), 10L, "치이카와", 1.0, NOW.minusDays(daysAgo));

        List<MemberSignalScore> scores = findScores("치이카와");

        assertThat(scores).hasSize(1);
        assertThat(scores.get(0).getScore()).isCloseTo(expected, within(1e-6));
    }

    @Test
    @DisplayName("weight가 점수에 그대로 곱해진다")
    void findMemberScores_multipliesWeight() {
        Member member = saveMember("weight-user", "oauth-weight");
        saveSignal(member.getId(), 10L, "치이카와", 2.0, NOW.minusDays(30));

        List<MemberSignalScore> scores = findScores("치이카와");

        assertThat(scores.get(0).getScore()).isCloseTo(1.0, within(1e-6)); // 2.0 * 0.5
    }

    @Test
    @DisplayName("같은 회원의 같은 키워드 신호는 대상(target)이 달라도 점수를 합산한다")
    void findMemberScores_sumsAcrossTargets() {
        Member member = saveMember("sum-user", "oauth-sum");
        saveSignal(member.getId(), 10L, "치이카와", 1.0, NOW);               // 1.0
        saveSignal(member.getId(), 11L, "치이카와", 1.0, NOW.minusDays(30)); // 0.5

        List<MemberSignalScore> scores = findScores("치이카와");

        assertThat(scores).hasSize(1);
        assertThat(scores.get(0).getScore()).isCloseTo(1.5, within(1e-6));
    }

    @Test
    @DisplayName("조회 대상이 아닌 신호 값은 결과에 포함되지 않는다")
    void findMemberScores_filtersBySignalValue() {
        Member member = saveMember("filter-user", "oauth-filter");
        saveSignal(member.getId(), 10L, "치이카와", 1.0, NOW);
        saveSignal(member.getId(), 11L, "하치와레", 1.0, NOW);

        List<MemberSignalScore> scores = findScores("치이카와");

        assertThat(scores).extracting(MemberSignalScore::getSignalValue)
                .containsExactly("치이카와");
    }

    @Test
    @DisplayName("탈퇴한 회원의 신호는 점수 계산에서 제외된다")
    void findMemberScores_excludesWithdrawnMembers() {
        Member active = saveMember("active-user", "oauth-active");
        Member withdrawn = saveMember("withdrawn-user", "oauth-withdrawn");
        saveSignal(active.getId(), 10L, "치이카와", 1.0, NOW);
        saveSignal(withdrawn.getId(), 10L, "치이카와", 1.0, NOW);

        memberJpaRepository.delete(withdrawn);   // @SQLDelete로 soft delete
        memberJpaRepository.flush();

        List<MemberSignalScore> scores = findScores("치이카와");

        assertThat(scores).extracting(MemberSignalScore::getMemberId)
                .containsExactly(active.getId());
    }

    private List<MemberSignalScore> findScores(final String... values) {
        return repository.findMemberScores(KEYWORD, List.of(values), NOW, HALF_LIFE_DAYS);
    }

    private void saveSignal(
            final Long memberId, final Long targetId, final String value,
            final double weight, final LocalDateTime favoriteAt
    ) {
        repository.saveAndFlush(FavoriteSignal.of(
                memberId, FavoriteType.TRADE, targetId, SignalType.KEYWORD, value, weight, favoriteAt));
    }

    private Member saveMember(final String nickname, final String oauthKey) {
        return memberJpaRepository.saveAndFlush(Member.builder()
                .oauthId(new OauthId(oauthKey, OauthProviderType.KAKAO))
                .nickname(nickname)
                .build());
    }
}

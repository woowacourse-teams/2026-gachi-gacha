package com.gachi.gacha.server.news.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsItemJpaRepository extends JpaRepository<NewsItem, Long> {

    /**
     * 목록에 보여줄 소식. 공개 시각이 지났고, 끝난 지 오래된 소식은 뺀다.
     *
     * <p>숨기는 기준은 종료일이다. 종료일이 없으면 시작일, 둘 다 없으면 공개 시각을 기준으로 같은 기간이 지나면 숨긴다.
     * 한 주제의 소식은 주 2회 수집해서 많아야 수십 건이라 정렬과 페이징은 호출하는 쪽에서 한다.
     *
     * @param hideBefore   이 날짜보다 일찍 끝난 소식은 숨긴다
     * @param hideBeforeAt {@code hideBefore} 의 시작 시각. 날짜가 없는 소식의 공개 시각과 비교한다
     */
    @Query("""
            select item from NewsItem item join fetch item.candidate candidate
            where item.topic = :topic and item.publishedAt <= :now
              and ((candidate.endDate is not null and candidate.endDate >= :hideBefore)
                or (candidate.endDate is null and candidate.startDate is not null and candidate.startDate >= :hideBefore)
                or (candidate.endDate is null and candidate.startDate is null and item.publishedAt >= :hideBeforeAt))
            """)
    List<NewsItem> findVisible(
            @Param("topic") String topic,
            @Param("now") LocalDateTime now,
            @Param("hideBefore") LocalDate hideBefore,
            @Param("hideBeforeAt") LocalDateTime hideBeforeAt
    );

    /**
     * 이미 공개된 링크. 같은 링크의 소식이 다시 수집돼도 승인 요청에 올리지 않으려고 찾는다.
     */
    @Query("select item.linkKey from NewsItem item where item.topic = :topic and item.linkKey in :linkKeys")
    List<String> findPublishedLinkKeys(@Param("topic") String topic, @Param("linkKeys") Collection<String> linkKeys);
}

package com.gachi.gacha.server.news.domain;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsExclusionJpaRepository extends JpaRepository<NewsExclusion, Long> {

    boolean existsByTopicAndLinkKey(String topic, String linkKey);

    List<NewsExclusion> findAllByTopicAndLinkKeyIn(String topic, Collection<String> linkKeys);

    void deleteByTopicAndLinkKey(String topic, String linkKey);
}

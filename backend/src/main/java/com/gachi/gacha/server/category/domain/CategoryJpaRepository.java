package com.gachi.gacha.server.category.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryJpaRepository extends JpaRepository<Category, Long> {

    List<Category> findByNameContainingIgnoreCaseOrderByNameAsc(final String keyword);

    List<Category> findAllByOrderByNameAsc();
}

package com.gachi.gacha.server.trade.application;

import com.gachi.gacha.server.trade.application.dto.CategoryInfo;
import com.gachi.gacha.server.trade.domain.CategoryJpaRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryJpaRepository categoryRepository;

    /**
     * 검색어가 없으면 전체 목록을 내려준다. 사용자가 입력을 시작하기 전에도 선택할 후보를 보여줘야 하기 때문이다.
     * 카테고리는 운영자가 관리하는 소수의 고정 데이터라 전체 조회를 페이징 없이 둔다.
     */
    public List<CategoryInfo> searchCategories(@Nullable final String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return categoryRepository.findAllByOrderByNameAsc().stream()
                    .map(CategoryInfo::from)
                    .toList();
        }

        return categoryRepository.findByNameContainingIgnoreCaseOrderByNameAsc(keyword.trim()).stream()
                .map(CategoryInfo::from)
                .toList();
    }
}

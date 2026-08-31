package com.gachi.gacha.server.gacha.application;

import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GachaService {

    private final GachaJpaRepository gachaRepository;

    public Page<GachaInfo> findAllGacha(@Nullable final String keyword, final Pageable pageable) {
        if (keyword == null || keyword.isBlank()) {
            return gachaRepository.findAllWithCategories(pageable)
                    .map(GachaInfo::from);
        }
        return gachaRepository.findByNameContainingWithCategories(keyword, pageable)
                .map(GachaInfo::from);
    }

    public GachaInfo findGachaById(final Long gachaId) {
        return GachaInfo.from(gachaRepository.getById(gachaId));
    }
}

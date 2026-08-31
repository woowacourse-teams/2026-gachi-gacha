package com.gachi.gacha.server.gacha.application;

import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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
            return toOrderedPage(gachaRepository.findGachaIds(pageable))
                    .map(GachaInfo::from);
        }
        return toOrderedPage(gachaRepository.findGachaIdsByNameContaining(keyword, pageable))
                .map(GachaInfo::from);
    }

    public GachaInfo findGachaById(final Long gachaId) {
        return GachaInfo.from(gachaRepository.getById(gachaId));
    }

    private Page<Gacha> toOrderedPage(final Page<Long> idPage) {
        List<Gacha> gachas = gachaRepository.findByIdsWithCategories(idPage.getContent());

        Map<Long, Gacha> gachaById = gachas.stream()
                .collect(Collectors.toMap(Gacha::getId, Function.identity()));

        List<Gacha> ordered = idPage.getContent().stream()
                .map(gachaById::get)
                .toList();

        return new PageImpl<>(ordered, idPage.getPageable(), idPage.getTotalElements());
    }
}

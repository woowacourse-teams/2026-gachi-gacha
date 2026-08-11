package com.gachi.gacha.server.gacha.application;

import com.gachi.gacha.server.gacha.application.dto.GachaCreateCommand;
import com.gachi.gacha.server.gacha.application.dto.GachaDeleteResult;
import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import com.gachi.gacha.server.gacha.application.dto.GachaResult;
import com.gachi.gacha.server.gacha.application.dto.GachaUpdateCommand;
import com.gachi.gacha.server.gacha.domain.Gacha;
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

    @Transactional
    public GachaInfo addGacha(final GachaCreateCommand command) {
        Gacha gacha = command.toEntity();
        Gacha savedGacha = gachaRepository.save(gacha);
        return GachaInfo.from(savedGacha);
    }

    @Transactional
    public GachaResult modify(final Long gachaId, final GachaUpdateCommand command) {
        Gacha gacha = gachaRepository.getById(gachaId);
        gacha.update(command.name(), command.caption(), command.thumbnailUrl());
        Gacha saved = gachaRepository.save(gacha);
        return GachaResult.from(saved);
    }

    @Transactional
    public GachaDeleteResult remove(final Long gachaId) {
        Gacha gacha = gachaRepository.getById(gachaId);
        gachaRepository.deleteById(gachaId);
        return GachaDeleteResult.from(gacha);
    }

    public Page<GachaInfo> findAllGacha(@Nullable final String keyword, final Pageable pageable) {
        if (keyword == null) {
            return gachaRepository.findAll(pageable)
                    .map(GachaInfo::from);
        }
        return gachaRepository.findByNameContaining(keyword, pageable)
                    .map(GachaInfo::from);
    }

    public GachaInfo findGachaById(final Long gachaId) {
        return GachaInfo.from(gachaRepository.getById(gachaId));
    }
}

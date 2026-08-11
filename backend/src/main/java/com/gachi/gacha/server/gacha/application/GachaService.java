package com.gachi.gacha.server.gacha.application;

import com.gachi.gacha.server.gacha.application.dto.GachaCreateCommand;
import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GachaService {

    private final GachaJpaRepository gachaRepository;

    @Transactional
    public GachaInfo addGacha(GachaCreateCommand command) {
        Gacha gacha = command.toEntity();
        Gacha savedGacha = gachaRepository.save(gacha);
        return GachaInfo.from(savedGacha);
    }
}

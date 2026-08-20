package com.gachi.gacha.server.gacha.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gachi.gacha.server.common.util.S3TransactionManager;
import com.gachi.gacha.server.gacha.application.dto.GachaUpdateCommand;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaImageJpaRepository;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GachaServiceTest {

    @Mock
    private GachaJpaRepository gachaRepository;

    @Mock
    private GachaImageJpaRepository gachaImageRepository;

    @Mock
    private S3TransactionManager s3TransactionManager;

    private GachaService service() {
        return new GachaService(gachaRepository, gachaImageRepository, s3TransactionManager);
    }

    @Test
    @DisplayName("가챠 정보를 수정하면 이름/설명/썸네일이 갱신되고 저장된다.")
    void modify_updatesFields_andPersists() {
        // given
        Gacha gacha = Gacha.builder()
                .id(1L)
                .name("임시 이름")
                .caption("입고 안내")
                .thumbnailUrl("https://example.com/thumb.jpg")
                .instagramMediaId("media-1")
                .build();
        when(gachaRepository.getById(1L)).thenReturn(gacha);
        when(gachaRepository.save(gacha)).thenReturn(gacha);

        // when
        service().modify(1L, new GachaUpdateCommand("정식 상품명", "새 설명", "https://example.com/new.jpg"));

        // then
        assertThat(gacha.getName()).isEqualTo("정식 상품명");
        assertThat(gacha.getCaption()).isEqualTo("새 설명");
        assertThat(gacha.getThumbnailUrl()).isEqualTo("https://example.com/new.jpg");
        verify(gachaRepository).save(gacha);
    }
}

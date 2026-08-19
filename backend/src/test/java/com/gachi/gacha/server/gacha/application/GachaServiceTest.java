package com.gachi.gacha.server.gacha.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gachi.gacha.server.common.util.S3TransactionManager;
import com.gachi.gacha.server.gacha.application.dto.AdminGachaResult;
import com.gachi.gacha.server.gacha.application.dto.GachaApproveCommand;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.domain.GachaImageJpaRepository;
import com.gachi.gacha.server.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.server.gacha.domain.GachaStatus;
import java.util.List;
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
    @DisplayName("가챠를 승인하면 이름과 상태가 변경되고, 변경된 상태를 저장 및 반환한다.")
    void approve_updatesNameAndStatus_andPersists() {
        // given
        Gacha gacha = Gacha.builder()
                .id(1L)
                .name("임시이름_수동검수필요")
                .caption("입고 안내")
                .thumbnailUrl("https://example.com/thumb.jpg")
                .instagramMediaId("media-1")
                .build();
        when(gachaRepository.getById(1L)).thenReturn(gacha);
        when(gachaRepository.save(gacha)).thenReturn(gacha);

        // when
        AdminGachaResult result = service().approve(new GachaApproveCommand(1L, "정식 상품명"));

        // then
        assertThat(gacha.getName()).isEqualTo("정식 상품명");
        assertThat(gacha.getStatus()).isEqualTo(GachaStatus.APPROVED);
        assertThat(result.gachaId()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("정식 상품명");
        assertThat(result.status()).isEqualTo(GachaStatus.APPROVED);
        verify(gachaRepository).save(gacha);
    }

    @Test
    @DisplayName("가챠를 거절하면 상태만 REJECTED로 변경되고 이름은 유지된다.")
    void reject_updatesStatusOnly_keepsName() {
        // given
        Gacha gacha = Gacha.builder()
                .id(2L)
                .name("임시이름_수동검수필요")
                .caption("신상 입고")
                .thumbnailUrl("https://example.com/thumb2.jpg")
                .instagramMediaId("media-2")
                .build();
        when(gachaRepository.getById(2L)).thenReturn(gacha);
        when(gachaRepository.save(gacha)).thenReturn(gacha);

        // when
        AdminGachaResult result = service().reject(2L);

        // then
        assertThat(gacha.getName()).isEqualTo("임시이름_수동검수필요");
        assertThat(gacha.getStatus()).isEqualTo(GachaStatus.REJECTED);
        assertThat(result.gachaId()).isEqualTo(2L);
        assertThat(result.status()).isEqualTo(GachaStatus.REJECTED);
        verify(gachaRepository).save(gacha);
    }

    @Test
    @DisplayName("PENDING 상태인 가챠 목록만 조회한다.")
    void getPendingGachas_returnsOnlyPendingStatusGachas() {
        // given
        Gacha pending1 = Gacha.builder().id(3L).name("a").instagramMediaId("media-3").build();
        Gacha pending2 = Gacha.builder().id(4L).name("b").instagramMediaId("media-4").build();
        when(gachaRepository.findAllByStatus(GachaStatus.PENDING)).thenReturn(List.of(pending1, pending2));

        // when
        List<Gacha> result = service().getPendingGachas();

        // then
        assertThat(result).containsExactly(pending1, pending2);
    }
}

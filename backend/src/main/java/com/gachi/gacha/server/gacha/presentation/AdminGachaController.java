package com.gachi.gacha.server.gacha.presentation;

import com.gachi.gacha.server.gacha.application.GachaService;
import com.gachi.gacha.server.gacha.domain.Gacha;
import com.gachi.gacha.server.gacha.presentation.dto.AdminGachaApproveRequest;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/gachas")
public class AdminGachaController {

    private final GachaService gachaService;

    public AdminGachaController(final GachaService gachaService) {
        this.gachaService = gachaService;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Gacha>> getPendingGachas() {
        return ResponseEntity.ok(gachaService.getPendingGachas());
    }

    @PatchMapping("/{gachaId}/approve")
    public ResponseEntity<Void> approveGacha(
            @PathVariable final Long gachaId,
            @RequestBody final AdminGachaApproveRequest request) {

        gachaService.approve(request.toCommand(gachaId));

        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{gachaId}/reject")
    public ResponseEntity<Void> rejectGacha(@PathVariable final Long gachaId) {

        gachaService.reject(gachaId);

        return ResponseEntity.ok().build();
    }
}

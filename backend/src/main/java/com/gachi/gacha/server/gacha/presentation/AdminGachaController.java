package com.gachi.gacha.server.gacha.presentation;

import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.gacha.application.GachaService;
import com.gachi.gacha.server.gacha.application.dto.AdminGachaResult;
import com.gachi.gacha.server.gacha.application.dto.GachaInfo;
import com.gachi.gacha.server.gacha.presentation.dto.AdminGachaActionResponse;
import com.gachi.gacha.server.gacha.presentation.dto.AdminGachaApproveRequest;
import com.gachi.gacha.server.gacha.presentation.dto.GachaCollectResponse;
import com.gachi.gacha.server.gacha.presentation.dto.GachaResponse;
import com.gachi.gacha.server.collection.application.GachaBatchFacade;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/gachas")
public class AdminGachaController {

    private final GachaService gachaService;
    private final GachaBatchFacade gachaBatchFacade;

    public AdminGachaController(
            final GachaService gachaService,
            final GachaBatchFacade gachaBatchFacade) {
        this.gachaService = gachaService;
        this.gachaBatchFacade = gachaBatchFacade;
    }

    @PostMapping("/collect")
    public BaseResponse<GachaCollectResponse> collectGachaDataManually() {
        int collectedCount = gachaBatchFacade.collectAllGachas();
        return BaseResponse.ok(GachaCollectResponse.from(collectedCount));
    }

    @GetMapping("/pending")
    public BaseResponse<List<GachaResponse>> getPendingGachas() {
        List<GachaResponse> pendingGachas = gachaService.getPendingGachas().stream()
                .map(GachaInfo::from)
                .map(GachaResponse::from)
                .toList();
        return BaseResponse.ok(pendingGachas);
    }

    @PatchMapping("/{gachaId}/approve")
    public BaseResponse<AdminGachaActionResponse> approveGacha(
            @PathVariable final Long gachaId,
            @RequestBody final AdminGachaApproveRequest request) {
        AdminGachaResult result = gachaService.approve(request.toCommand(gachaId));
        return BaseResponse.updated(AdminGachaActionResponse.from(result));
    }

    @PatchMapping("/{gachaId}/reject")
    public BaseResponse<AdminGachaActionResponse> rejectGacha(@PathVariable final Long gachaId) {
        AdminGachaResult result = gachaService.reject(gachaId);
        return BaseResponse.updated(AdminGachaActionResponse.from(result));
    }
}

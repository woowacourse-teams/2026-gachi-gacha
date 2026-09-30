package com.gachi.gacha.server.file.presentation;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.config.OpenApiConfig;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.file.application.FileService;
import com.gachi.gacha.server.file.presentation.dto.FileUploadListResponse;
import com.gachi.gacha.server.file.presentation.dto.FileUploadResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "파일", description = "이미지 업로드")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @Operation(
            summary = "이미지 업로드",
            description = """
                    이미지를 S3 에 올리고 URL 을 반환한다. 채팅으로 사진을 보낼 때처럼,
                    등록 대상과 무관하게 URL 만 먼저 필요한 경우에 쓴다.

                    파일 1개당 10MB, 요청 전체 50MB 까지 허용한다.
                    파트 이름은 `files` 이며 여러 장을 한 번에 보낼 수 있다."""
    )
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BaseResponse<FileUploadListResponse> uploadFiles(
            @Auth final Long memberId,
            // @Parameter 를 붙이면 multipart body 스키마 전체가 루트 배열로 대체되어
            // 파트 이름("files")이 사라진다. 기본 생성 결과가 맞으므로 어노테이션을 두지 않는다.
            @RequestParam("files") final List<MultipartFile> files
    ) {
        List<FileUploadResponse> responses = fileService.uploadFiles(files).stream()
                .map(FileUploadResponse::from)
                .toList();

        return BaseResponse.ok(FileUploadListResponse.from(responses));
    }
}

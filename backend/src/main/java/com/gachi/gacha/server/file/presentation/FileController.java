package com.gachi.gacha.server.file.presentation;

import com.gachi.gacha.server.common.auth.resolver.Auth;
import com.gachi.gacha.server.common.domain.dto.BaseResponse;
import com.gachi.gacha.server.file.application.FileService;
import com.gachi.gacha.server.file.presentation.dto.FileUploadListResponse;
import com.gachi.gacha.server.file.presentation.dto.FileUploadResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BaseResponse<FileUploadListResponse> uploadFiles(
            @Auth final Long memberId,
            @RequestParam("files") final List<MultipartFile> files
    ) {
        List<FileUploadResponse> responses = fileService.uploadFiles(files).stream()
                .map(FileUploadResponse::from)
                .toList();

        return BaseResponse.ok(FileUploadListResponse.from(responses));
    }
}

package com.gachi.gacha.server.common.infra.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FileType {
    CHAT("채팅", "chat");

    private final String label;
    private final String folderName;

    public String buildPath(final String s3RootFolder) {
        return "%s/%s".formatted(s3RootFolder, folderName);
    }
}

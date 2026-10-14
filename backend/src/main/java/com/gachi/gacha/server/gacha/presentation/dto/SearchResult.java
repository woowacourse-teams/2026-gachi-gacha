package com.gachi.gacha.server.gacha.presentation.dto;

import java.util.List;

public record SearchResult<T>(
        List<T> content,
        int page,
        int size,
        boolean hasNext
) {}

package com.gachi.gacha.server.news.application.dto;

import java.util.List;

public record NewsPageInfo(List<NewsItemInfo> items, boolean hasNext) {
}

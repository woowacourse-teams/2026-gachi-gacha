package com.gachi.gacha.server.trade.application;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import java.io.IOException;
import java.io.InputStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TradeIndexInitializer {

    @Value("${elasticsearch.index.trade}")
    private String INDEX;

    private final TradeIndexService indexService;
    private final ElasticsearchClient esClient;

    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void initialize() {
        try {
            if (isIndexExists()) {
                return;
            }
            createIndex();
            log.info("trade 인덱스 생성 완료, 전체 색인 시작");
            reindexOrRollbackIndex();
        } catch (Exception e) {
            log.error("trade 인덱스 초기화 실패. 애플리케이션은 계속 기동됩니다.", e);
        }
    }

    private boolean isIndexExists() throws IOException {
        return esClient.indices().exists(request -> request.index(INDEX)).value();
    }

    private void createIndex() throws IOException {
        try (InputStream indexJson = new ClassPathResource("elastic/trade-index.json").getInputStream()) {
            esClient.indices().create(request -> request.index(INDEX).withJson(indexJson));
        }
    }

    private void reindexOrRollbackIndex() throws IOException {
        try {
            indexService.reindexAll();
        } catch (Exception e) {
            esClient.indices().delete(request -> request.index(INDEX));
            throw e;
        }
    }
}

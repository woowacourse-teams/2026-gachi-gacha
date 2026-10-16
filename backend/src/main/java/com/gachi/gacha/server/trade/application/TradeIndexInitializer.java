package com.gachi.gacha.server.trade.application;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import java.io.IOException;
import java.io.InputStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "elasticsearch.init.enabled", havingValue = "true", matchIfMissing = true)
public class TradeIndexInitializer implements ApplicationRunner {

    @Value("${elasticsearch.index.trade}")
    private String INDEX;

    private final TradeIndexService indexService;
    private final ElasticsearchClient esClient;

    @Override
    public void run(final ApplicationArguments args) throws IOException {
        if (esClient.indices().exists(e -> e.index(INDEX)).value()) {
            return;
        }

        try (InputStream is = new ClassPathResource("elastic/trade-index.json").getInputStream()) {
            esClient.indices().create(c -> c.index(INDEX).withJson(is));
        }
        log.info("trade 인덱스 생성 완료, 전체 색인 시작");
        indexService.reindexAll();
    }
}

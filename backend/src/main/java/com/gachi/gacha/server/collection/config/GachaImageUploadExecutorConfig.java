package com.gachi.gacha.server.collection.config;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GachaImageUploadExecutorConfig {

    private static final int THREAD_POOL_SIZE = 4;

    /**
     * 인스타그램에서 수집한 이미지를 S3로 옮기는 전용 스레드풀.
     * JVM 전역이 공유하는 parallelStream()의 ForkJoinPool은 다른 요청 처리와
     * 자원을 다투게 되므로 쓰지 않고, 크기를 고정한 별도 풀을 둔다.
     */
    @Bean(destroyMethod = "shutdown")
    public ExecutorService gachaImageUploadExecutor() {
        return Executors.newFixedThreadPool(THREAD_POOL_SIZE);
    }
}

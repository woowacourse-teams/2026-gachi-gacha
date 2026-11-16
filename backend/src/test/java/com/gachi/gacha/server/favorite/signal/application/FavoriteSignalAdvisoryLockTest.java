package com.gachi.gacha.server.favorite.signal.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.favorite.signal.domain.FavoriteType;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest
class FavoriteSignalAdvisoryLockTest {

    private static final Long MEMBER_ID = 7654321L;
    private static final Long TRADE_ID = 1234567L;

    @Autowired
    private FavoriteSignalAdvisoryLock advisoryLock;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Test
    @DisplayName("같은 회원과 게시글의 신호 작업은 앞선 트랜잭션이 끝날 때까지 대기한다")
    void acquire_serializesSameFavoriteSignalKey() throws Exception {
        CountDownLatch firstHasLock = new CountDownLatch(1);
        CountDownLatch releaseFirst = new CountDownLatch(1);
        CountDownLatch secondHasLock = new CountDownLatch(1);
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<?> first = executor.submit(() -> transactionTemplate.executeWithoutResult(status -> {
                advisoryLock.acquire(MEMBER_ID, FavoriteType.TRADE, TRADE_ID);
                firstHasLock.countDown();
                await(releaseFirst);
            }));
            assertThat(firstHasLock.await(5, TimeUnit.SECONDS)).isTrue();

            Future<?> second = executor.submit(() -> transactionTemplate.executeWithoutResult(status -> {
                advisoryLock.acquire(MEMBER_ID, FavoriteType.TRADE, TRADE_ID);
                secondHasLock.countDown();
            }));

            assertThat(secondHasLock.await(300, TimeUnit.MILLISECONDS)).isFalse();
            releaseFirst.countDown();

            assertThat(secondHasLock.await(5, TimeUnit.SECONDS)).isTrue();
            first.get(5, TimeUnit.SECONDS);
            second.get(5, TimeUnit.SECONDS);
        } finally {
            releaseFirst.countDown();
            executor.shutdownNow();
        }
    }

    private void await(final CountDownLatch latch) {
        try {
            if (!latch.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("timed out waiting to release advisory lock test transaction");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("interrupted while waiting in advisory lock test", e);
        }
    }
}

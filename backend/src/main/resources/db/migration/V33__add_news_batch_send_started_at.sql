-- 푸시 발송을 시작한 시각(SENDING 으로 표시한 시각). 서버가 발송 중에 멈춰 SENDING 에 오래 남은 회차를 찾는 기준이다
ALTER TABLE news_batch
    ADD COLUMN send_started_at TIMESTAMP(6);

ALTER TABLE notification
    ALTER COLUMN comment_id DROP NOT NULL;

CREATE UNIQUE INDEX uk_notification_trade_recommendation_receiver
    ON notification (trade_id, receiver_id)
    WHERE type = 'TRADE_RECOMMENDATION';

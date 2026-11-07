CREATE INDEX idx_notification_receiver_type_created
    ON notification (receiver_id, type, created_at);

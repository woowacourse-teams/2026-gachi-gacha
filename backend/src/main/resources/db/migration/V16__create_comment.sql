CREATE TABLE comment
(
    id                BIGSERIAL PRIMARY KEY,
    trade_id          BIGINT       NOT NULL REFERENCES trade (id) ON DELETE CASCADE,
    member_id         BIGINT       REFERENCES member (id),
    nickname          VARCHAR(50)  NOT NULL,
    ip                VARCHAR(20),
    profile_image_url VARCHAR(500),
    content           VARCHAR(500) NOT NULL,
    created_at        TIMESTAMP    NOT NULL,
    updated_at        TIMESTAMP    NOT NULL,

    -- 회원이면 IP 를 남기지 않고, 비회원이면 반드시 남긴다.
    CONSTRAINT chk_comment_author CHECK (
        (member_id IS NULL AND ip IS NOT NULL) OR
        (member_id IS NOT NULL AND ip IS NULL)
        )
);

CREATE INDEX idx_comment_trade_id ON comment (trade_id, id);

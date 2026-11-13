CREATE TABLE trade_inference (
                                 trade_id BIGINT PRIMARY KEY,
                                 inferred_gacha_id BIGINT,
                                 score DOUBLE PRECISION,
                                 inferred_at TIMESTAMP(6) NOT NULL,

                                 CONSTRAINT fk_trade_inference_trade
                                     FOREIGN KEY (trade_id) REFERENCES trade (id) ON DELETE CASCADE,

                                 CONSTRAINT fk_trade_inference_gacha
                                     FOREIGN KEY (inferred_gacha_id) REFERENCES gacha (id) ON DELETE SET NULL
);

CREATE TABLE trade_inferred_category (
                                         trade_id BIGINT NOT NULL,
                                         category_id BIGINT NOT NULL,

                                         PRIMARY KEY (trade_id, category_id),

                                         CONSTRAINT fk_trade_inferred_category_trade
                                             FOREIGN KEY (trade_id) REFERENCES trade (id) ON DELETE CASCADE,

                                         CONSTRAINT fk_trade_inferred_category_category
                                             FOREIGN KEY (category_id) REFERENCES category (id) ON DELETE CASCADE
);

CREATE INDEX idx_trade_inference_gacha_id
    ON trade_inference (inferred_gacha_id);

CREATE INDEX idx_trade_inferred_category_category_id
    ON trade_inferred_category (category_id);

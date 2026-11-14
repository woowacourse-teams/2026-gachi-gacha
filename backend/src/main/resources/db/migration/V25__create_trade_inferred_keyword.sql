CREATE TABLE trade_inferred_keyword (
                                        trade_id BIGINT NOT NULL,
                                        keyword VARCHAR(100) NOT NULL,

                                        PRIMARY KEY (trade_id, keyword),

                                        CONSTRAINT fk_trade_inferred_keyword_trade
                                            FOREIGN KEY (trade_id) REFERENCES trade (id) ON DELETE CASCADE
);

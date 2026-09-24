ALTER TABLE store_gacha
    ADD CONSTRAINT uk_store_gacha_gacha_store UNIQUE (gacha_id, store_id);

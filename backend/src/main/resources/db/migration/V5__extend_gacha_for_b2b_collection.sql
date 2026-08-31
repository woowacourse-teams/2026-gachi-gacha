ALTER TABLE gacha
    ADD COLUMN source VARCHAR(30) DEFAULT 'MANUAL',
    ADD COLUMN product_code VARCHAR(255),
    ADD COLUMN category VARCHAR(255);

UPDATE gacha
SET source = 'INSTAGRAM'
WHERE instagram_media_id IS NOT NULL;

ALTER TABLE gacha
    ALTER COLUMN source SET NOT NULL;

ALTER TABLE gacha
    ADD CONSTRAINT uk_gacha_source_product_code
        UNIQUE (source, product_code);

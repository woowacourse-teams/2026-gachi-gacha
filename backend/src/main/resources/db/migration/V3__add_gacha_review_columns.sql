ALTER TABLE gacha
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

ALTER TABLE gacha
    ADD COLUMN instagram_media_id VARCHAR(255);

ALTER TABLE gacha
    ADD CONSTRAINT uk_gacha_instagram_media_id UNIQUE (instagram_media_id);

ALTER TABLE gacha
    ALTER COLUMN caption TYPE TEXT;

ALTER TABLE gacha
    ALTER COLUMN thumbnail_url TYPE VARCHAR(1000);

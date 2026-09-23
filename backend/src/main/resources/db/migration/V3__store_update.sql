ALTER TABLE store
    ADD COLUMN address VARCHAR(255),
    ADD COLUMN floor INTEGER,
    ADD COLUMN unit VARCHAR(50);

UPDATE store s
SET
    name = COALESCE(s.name, sd.name),
    address = sd.address
    FROM store_detail sd
WHERE sd.store_id = s.id;

ALTER TABLE store
    ALTER COLUMN name SET NOT NULL,
ALTER COLUMN address SET NOT NULL;

ALTER TABLE store_detail
DROP COLUMN name,
    DROP COLUMN address;

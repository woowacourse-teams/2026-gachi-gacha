CREATE INDEX idx_store_location_geography
    ON store
    USING GIST ((location::geography));

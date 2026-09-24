ALTER TABLE trade RENAME COLUMN trade_place TO trade_place_address;

ALTER TABLE trade ADD COLUMN purchase_store_name VARCHAR(255);
ALTER TABLE trade ADD COLUMN purchase_store_latitude DOUBLE PRECISION;
ALTER TABLE trade ADD COLUMN purchase_store_longitude DOUBLE PRECISION;

ALTER TABLE trade ADD COLUMN trade_place_name VARCHAR(255);
ALTER TABLE trade ADD COLUMN trade_place_latitude DOUBLE PRECISION;
ALTER TABLE trade ADD COLUMN trade_place_longitude DOUBLE PRECISION;

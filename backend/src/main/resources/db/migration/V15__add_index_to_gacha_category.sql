-- gacha_category 에는 PK(id) 인덱스만 있었다.
-- PostgreSQL 은 FK 컬럼에 인덱스를 자동으로 만들지 않아 gacha_id, category_id 가 모두 인덱스 없이 쓰이고 있었다.
--
-- 두 인덱스 모두 복합으로 만든 이유는 컬럼이 둘뿐인 조인 테이블이라
-- 반대쪽 컬럼까지 담아도 크기 차이가 거의 없고, 테이블 접근 없이 Index Only Scan 으로 끝나기 때문이다.
-- 선행 컬럼 단일 조회도 커버하므로 ON DELETE CASCADE 가 도는 경로도 함께 해결된다.

-- 가챠 상세·목록의 카테고리 페치 조인, gacha 삭제 시 CASCADE
CREATE INDEX idx_gacha_category_gacha_id
    ON gacha_category (gacha_id, category_id);

-- 카테고리 기준 가챠 조회, category 삭제 시 CASCADE
CREATE INDEX idx_gacha_category_category_id
    ON gacha_category (category_id, gacha_id);

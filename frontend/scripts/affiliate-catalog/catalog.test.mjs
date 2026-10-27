import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCatalog, parseCatalogRows, parseCsv } from './catalog.mjs';

const HEADERS = [
  '상품제목',
  '썸네일URL',
  '네이버링크',
  '카테고리',
  '노출페이지',
  '노출시작일',
  '노출종료일',
  '노출여부',
].join(',');

test('CSV의 쉼표와 줄바꿈이 포함된 인용 셀을 파싱한다', () => {
  assert.deepEqual(parseCsv('a,b\n"one, two","line 1\nline 2"'), [
    ['a', 'b'],
    ['one, two', 'line 1\nline 2'],
  ]);
});

test('비활성 행은 무시하고 복수 카테고리와 경로를 읽는다', () => {
  const rows = parseCatalogRows(
    `${HEADERS}\n"산리오, 피규어",https://image.example/a.jpg,https://naver.me/example,산리오|피규어,https://gachigacha.kro.kr/search|/trade/12,2026-11-01,2026-11-30,TRUE\n,,,,,,,FALSE`,
  );

  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].categoryNames, ['산리오', '피규어']);
  assert.deepEqual(rows[0].placementPaths, ['/search', '/trade/12']);
});

test('노출 페이지를 비워 두면 검색 카테고리 화면을 기본값으로 사용한다', () => {
  const rows = parseCatalogRows(
    `${HEADERS}\n산리오 굿즈,https://image.example/a.jpg,https://naver.me/example,산리오,,,,TRUE`,
  );

  assert.deepEqual(rows[0].placementPaths, ['/search']);
});

test('카테고리 ID와 제휴 URL로 안정적인 ID를 생성하고 행 순서를 저장한다', async () => {
  const csvSource = `${HEADERS}\nA,https://image.example/a.jpg,https://naver.me/example-a,산리오,/search,2026-11-01,2026-11-30,TRUE\nB,https://image.example/b.jpg,https://naver.me/example-b,피규어,/search,,,TRUE`;
  const categories = new Map([
    ['산리오', { categoryId: 110, name: '산리오' }],
    ['피규어', { categoryId: 6, name: '피규어' }],
  ]);
  const catalog = await buildCatalog({
    csvSource,
    resolveCategory: async (categoryName) => categories.get(categoryName),
  });

  assert.equal(catalog.items.length, 2);
  assert.match(catalog.items[0].id, /^affiliate-110-[a-f0-9]{10}$/);
  assert.equal(catalog.items[0].order, 1);
  assert.equal(catalog.items[1].order, 2);
});

test('중복된 제휴 링크는 한 행으로 합치도록 안내한다', () => {
  const duplicatedRows = `${HEADERS}\nA,https://image.example/a.jpg,https://naver.me/example,산리오,/search,,,TRUE\nB,https://image.example/b.jpg,https://naver.me/example,피규어,/trade,,,TRUE`;

  assert.throws(() => parseCatalogRows(duplicatedRows), /2행과 중복/);
});

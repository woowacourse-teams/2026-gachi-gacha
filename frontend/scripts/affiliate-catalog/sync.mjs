import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildCatalog,
  resolveExactCategory,
  serializeCatalogModule,
} from './catalog.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(scriptDirectory, '../..');
const outputPath = path.join(
  frontendDirectory,
  'src/features/affiliateCatalog/generatedCatalog.ts',
);
const sheetCsvUrl = process.env.AFFILIATE_CATALOG_SHEET_CSV_URL?.trim();
const categoryApiUrl =
  process.env.AFFILIATE_CATALOG_CATEGORY_API_URL?.trim() ??
  'https://gachigacha.kro.kr/api/v1/categories';

if (!sheetCsvUrl) {
  throw new Error(
    'AFFILIATE_CATALOG_SHEET_CSV_URL을 GitHub Actions 변수나 실행 환경에 설정해 주세요.',
  );
}

const sheetResponse = await fetch(sheetCsvUrl, {
  headers: { Accept: 'text/csv,text/plain;q=0.9' },
  signal: AbortSignal.timeout(15_000),
});

if (!sheetResponse.ok) {
  throw new Error(
    `Google Sheet CSV를 불러오지 못했습니다: HTTP ${sheetResponse.status}`,
  );
}

const csvSource = await sheetResponse.text();

if (/^\s*<(?:!doctype|html)/i.test(csvSource)) {
  throw new Error(
    'Google Sheet가 CSV 대신 HTML을 반환했습니다. products 탭을 CSV로 게시했는지 확인해 주세요.',
  );
}

const catalog = await buildCatalog({
  csvSource,
  resolveCategory: (categoryName) =>
    resolveExactCategory(categoryName, categoryApiUrl),
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, serializeCatalogModule(catalog), 'utf8');

console.log(
  `제휴 상품 ${catalog.items.length}개를 동기화했습니다. revision=${catalog.revision}`,
);

import { createHash } from 'node:crypto';

export const SHEET_HEADERS = Object.freeze({
  title: '상품제목',
  thumbnailUrl: '썸네일URL',
  affiliateUrl: '네이버링크',
  categoryNames: '카테고리',
  placementPaths: '노출페이지',
  activeFrom: '노출시작일',
  activeUntil: '노출종료일',
  enabled: '노출여부',
});

const REQUIRED_HEADERS = Object.values(SHEET_HEADERS);
const ALLOWED_PLACEMENT_HOSTS = new Set([
  'gachigacha.kro.kr',
  'dev.gachigacha.kro.kr',
]);
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeCell(value) {
  return value.trim();
}

function normalizeCategoryName(value) {
  return normalizeCell(value).toLocaleLowerCase('ko-KR');
}

function splitMultipleValues(value) {
  return [
    ...new Set(
      value
        .split(/[|,\n]/)
        .map(normalizeCell)
        .filter(Boolean),
    ),
  ];
}

function isBlankRow(row) {
  return row.every((cell) => cell.trim() === '');
}

export function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }

      continue;
    }

    if (character === '"') {
      inQuotes = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error('CSV의 따옴표가 닫히지 않았습니다.');
  }

  row.push(field.replace(/\r$/, ''));

  if (!isBlankRow(row)) {
    rows.push(row);
  }

  return rows;
}

function assertHeaders(headers) {
  const duplicatedHeaders = headers.filter(
    (header, index) => header && headers.indexOf(header) !== index,
  );

  if (duplicatedHeaders.length > 0) {
    throw new Error(
      `시트에 중복된 헤더가 있습니다: ${[...new Set(duplicatedHeaders)].join(
        ', ',
      )}`,
    );
  }

  const missingHeaders = REQUIRED_HEADERS.filter(
    (requiredHeader) => !headers.includes(requiredHeader),
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `시트에 필수 헤더가 없습니다: ${missingHeaders.join(', ')}`,
    );
  }
}

function parseEnabled(value, rowNumber) {
  const normalizedValue = normalizeCell(value).toLocaleLowerCase('ko-KR');

  if (!normalizedValue || ['true', '1', '예', 'y'].includes(normalizedValue)) {
    return true;
  }

  if (['false', '0', '아니오', 'n'].includes(normalizedValue)) {
    return false;
  }

  throw new Error(`${rowNumber}행 노출여부는 TRUE 또는 FALSE로 입력해 주세요.`);
}

function parseDate(value, header, rowNumber) {
  const normalizedValue = normalizeCell(value);

  if (!normalizedValue) {
    return null;
  }

  if (!ISO_DATE_PATTERN.test(normalizedValue)) {
    throw new Error(
      `${rowNumber}행 ${header}은 YYYY-MM-DD 형식으로 입력해 주세요.`,
    );
  }

  const [year, month, day] = normalizedValue.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${rowNumber}행 ${header}에 유효한 날짜를 입력해 주세요.`);
  }

  return normalizedValue;
}

function parseHttpsUrl(value, header, rowNumber) {
  let url;

  try {
    url = new URL(normalizeCell(value));
  } catch {
    throw new Error(`${rowNumber}행 ${header}이 올바른 URL이 아닙니다.`);
  }

  if (url.protocol !== 'https:') {
    throw new Error(`${rowNumber}행 ${header}은 HTTPS URL이어야 합니다.`);
  }

  return url;
}

function parseAffiliateUrl(value, rowNumber) {
  const url = parseHttpsUrl(value, SHEET_HEADERS.affiliateUrl, rowNumber);

  if (url.hostname !== 'naver.me') {
    throw new Error(
      `${rowNumber}행 ${SHEET_HEADERS.affiliateUrl}에는 naver.me 발급 링크를 입력해 주세요.`,
    );
  }

  return url.toString();
}

function parsePlacementPath(value, rowNumber) {
  const normalizedValue = normalizeCell(value);

  if (normalizedValue.startsWith('/')) {
    const url = new URL(normalizedValue, 'https://gachigacha.kro.kr');

    return normalizePathname(url.pathname);
  }

  const url = parseHttpsUrl(
    normalizedValue,
    SHEET_HEADERS.placementPaths,
    rowNumber,
  );

  if (!ALLOWED_PLACEMENT_HOSTS.has(url.hostname)) {
    throw new Error(
      `${rowNumber}행 ${SHEET_HEADERS.placementPaths}에는 가치가챠 경로나 URL만 입력할 수 있습니다.`,
    );
  }

  return normalizePathname(url.pathname);
}

function normalizePathname(pathname) {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.replace(/\/+$/, '');
}

function getRequiredCell(record, header, rowNumber) {
  const value = normalizeCell(record[header] ?? '');

  if (!value) {
    throw new Error(`${rowNumber}행 ${header}을(를) 입력해 주세요.`);
  }

  return value;
}

export function parseCatalogRows(csvSource) {
  const rows = parseCsv(csvSource);

  if (rows.length === 0) {
    throw new Error('시트가 비어 있습니다.');
  }

  const headers = rows[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, '').trim() : header.trim(),
  );

  assertHeaders(headers);

  const parsedRows = [];
  const seenAffiliateUrls = new Map();

  rows.slice(1).forEach((cells, index) => {
    if (isBlankRow(cells)) {
      return;
    }

    const rowNumber = index + 2;
    const record = Object.fromEntries(
      headers.map((header, headerIndex) => [header, cells[headerIndex] ?? '']),
    );
    const enabled = parseEnabled(
      record[SHEET_HEADERS.enabled] ?? '',
      rowNumber,
    );

    if (!enabled) {
      return;
    }

    const title = getRequiredCell(record, SHEET_HEADERS.title, rowNumber);
    const thumbnailUrl = parseHttpsUrl(
      getRequiredCell(record, SHEET_HEADERS.thumbnailUrl, rowNumber),
      SHEET_HEADERS.thumbnailUrl,
      rowNumber,
    ).toString();
    const affiliateUrl = parseAffiliateUrl(
      getRequiredCell(record, SHEET_HEADERS.affiliateUrl, rowNumber),
      rowNumber,
    );
    const categoryNames = splitMultipleValues(
      getRequiredCell(record, SHEET_HEADERS.categoryNames, rowNumber),
    );
    const placementValues = splitMultipleValues(
      record[SHEET_HEADERS.placementPaths] ?? '',
    );
    const placementPaths = (
      placementValues.length > 0 ? placementValues : ['/search']
    ).map((path) => parsePlacementPath(path, rowNumber));
    const activeFrom = parseDate(
      record[SHEET_HEADERS.activeFrom] ?? '',
      SHEET_HEADERS.activeFrom,
      rowNumber,
    );
    const activeUntil = parseDate(
      record[SHEET_HEADERS.activeUntil] ?? '',
      SHEET_HEADERS.activeUntil,
      rowNumber,
    );

    if (activeFrom && activeUntil && activeFrom > activeUntil) {
      throw new Error(
        `${rowNumber}행 ${SHEET_HEADERS.activeUntil}은 ${SHEET_HEADERS.activeFrom} 이후여야 합니다.`,
      );
    }

    const duplicateRowNumber = seenAffiliateUrls.get(affiliateUrl);

    if (duplicateRowNumber) {
      throw new Error(
        `${rowNumber}행 ${SHEET_HEADERS.affiliateUrl}은 ${duplicateRowNumber}행과 중복됩니다. 여러 카테고리나 페이지는 한 셀에 | 로 구분해 주세요.`,
      );
    }

    seenAffiliateUrls.set(affiliateUrl, rowNumber);
    parsedRows.push({
      rowNumber,
      title,
      thumbnailUrl,
      affiliateUrl,
      categoryNames,
      placementPaths: [...new Set(placementPaths)],
      activeFrom,
      activeUntil,
    });
  });

  return parsedRows;
}

export async function resolveExactCategory(categoryName, categoryApiUrl) {
  const url = new URL(categoryApiUrl);

  url.searchParams.set('keyword', categoryName);

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(
      `카테고리 API가 ${response.status}로 응답했습니다: ${categoryName}`,
    );
  }

  const body = await response.json();

  if (
    typeof body !== 'object' ||
    body === null ||
    body.code !== 'C000' ||
    typeof body.data !== 'object' ||
    body.data === null ||
    !Array.isArray(body.data.items)
  ) {
    throw new Error(
      `카테고리 API 응답 형식이 올바르지 않습니다: ${categoryName}`,
    );
  }

  const candidates = body.data.items.filter(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      Number.isSafeInteger(item.categoryId) &&
      item.categoryId > 0 &&
      typeof item.name === 'string',
  );
  const exactMatches = candidates.filter(
    (candidate) =>
      normalizeCategoryName(candidate.name) ===
      normalizeCategoryName(categoryName),
  );

  if (exactMatches.length !== 1) {
    const candidateNames = candidates
      .map((candidate) => candidate.name)
      .slice(0, 5)
      .join(', ');
    const suggestion = candidateNames
      ? ` API 후보: ${candidateNames}`
      : ' API에서 후보를 찾지 못했습니다.';

    throw new Error(
      `카테고리명과 정확히 일치하는 항목이 ${exactMatches.length}개입니다: ${categoryName}.${suggestion}`,
    );
  }

  return {
    categoryId: exactMatches[0].categoryId,
    name: exactMatches[0].name.trim(),
  };
}

function createProductId(primaryCategoryId, affiliateUrl) {
  const linkHash = createHash('sha256')
    .update(affiliateUrl)
    .digest('hex')
    .slice(0, 10);

  return `affiliate-${primaryCategoryId}-${linkHash}`;
}

export async function buildCatalog({ csvSource, resolveCategory }) {
  const rows = parseCatalogRows(csvSource);
  const categoryCache = new Map();
  const products = [];

  for (const [index, row] of rows.entries()) {
    const categories = [];

    for (const categoryName of row.categoryNames) {
      const cacheKey = normalizeCategoryName(categoryName);
      let category = categoryCache.get(cacheKey);

      if (!category) {
        try {
          category = await resolveCategory(categoryName);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);

          throw new Error(`${row.rowNumber}행 카테고리 확인 실패: ${message}`, {
            cause: error,
          });
        }

        categoryCache.set(cacheKey, category);
      }

      categories.push(category);
    }

    const uniqueCategories = [
      ...new Map(
        categories.map((category) => [category.categoryId, category]),
      ).values(),
    ];
    const primaryCategory = uniqueCategories[0];

    if (!primaryCategory) {
      throw new Error(`${row.rowNumber}행의 카테고리를 확인할 수 없습니다.`);
    }

    products.push({
      id: createProductId(primaryCategory.categoryId, row.affiliateUrl),
      title: row.title,
      thumbnailUrl: row.thumbnailUrl,
      affiliateUrl: row.affiliateUrl,
      categories: uniqueCategories,
      placementPaths: row.placementPaths,
      activeFrom: row.activeFrom,
      activeUntil: row.activeUntil,
      order: index + 1,
    });
  }

  const revision = createHash('sha256')
    .update(JSON.stringify(products))
    .digest('hex')
    .slice(0, 12);

  return { revision, items: products };
}

export function serializeCatalogModule(catalog) {
  return `import type { AffiliateCatalog } from './affiliateCatalogType';\n\nexport const AFFILIATE_CATALOG = ${JSON.stringify(
    catalog,
    null,
    2,
  )} as const satisfies AffiliateCatalog;\n`;
}

import { authenticatedFetch } from '@/features/auth/api/authenticatedFetch';
import { readAccessToken } from '@/features/auth/authTokenStorage';
import { readMemberIdFromAccessToken } from '@/features/auth/readMemberIdFromAccessToken';
import { isApiResponse } from '@/shared/api/isApiResponse';

const PAGE_SIZE = 100;
const MAX_TRADE_IDS = 10_000;
const COLLECTION_TIMEOUT_MS = 30_000;
const INVALID_RESPONSE_MESSAGE =
  '교환글 전체 목록을 확인하지 못했어요. 잠시 후 다시 시도해주세요.';
const SESSION_CHANGED_MESSAGE =
  '로그인 계정이 변경되었어요. 로그인 상태를 확인하고 다시 시도해주세요.';

interface ParticipationPage {
  tradeIds: number[];
  size: number;
  last: boolean;
  totalElements: number | undefined;
  totalPages: number | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function assertCurrentMember(expectedMemberId: string): void {
  const accessToken = readAccessToken();

  if (
    !/^[1-9]\d*$/.test(expectedMemberId) ||
    !accessToken ||
    readMemberIdFromAccessToken(accessToken) !== expectedMemberId
  ) {
    throw new Error(SESSION_CHANGED_MESSAGE);
  }
}

function parseParticipationPage(
  value: unknown,
  pageNumber: number,
  expectedMemberId: string,
): ParticipationPage {
  if (!isApiResponse(value) || value.code !== 'C000' || !isRecord(value.data)) {
    throw new Error(INVALID_RESPONSE_MESSAGE);
  }

  const data = value.data;

  if (
    !Array.isArray(data.content) ||
    data.number !== pageNumber ||
    !isNonNegativeInteger(data.size) ||
    data.size === 0 ||
    data.size > PAGE_SIZE ||
    data.content.length > data.size ||
    (data.last !== undefined && typeof data.last !== 'boolean')
  ) {
    throw new Error(INVALID_RESPONSE_MESSAGE);
  }

  // The collection only uses IDs. Reject every invalid row instead of dropping
  // it, and check ownership even though this is the authenticated /trades/me API.
  const tradeIds = data.content.map((trade: unknown) => {
    if (
      !isRecord(trade) ||
      !isNonNegativeInteger(trade.tradeId) ||
      trade.tradeId === 0 ||
      !isNonNegativeInteger(trade.memberId) ||
      String(trade.memberId) !== expectedMemberId
    ) {
      throw new Error(INVALID_RESPONSE_MESSAGE);
    }

    return trade.tradeId;
  });

  const hasTotals =
    data.totalElements !== undefined || data.totalPages !== undefined;
  let totalElements: number | undefined;
  let totalPages: number | undefined;

  if (hasTotals) {
    if (
      !isNonNegativeInteger(data.totalElements) ||
      data.totalElements > MAX_TRADE_IDS ||
      !isNonNegativeInteger(data.totalPages) ||
      data.totalPages !== Math.ceil(data.totalElements / data.size) ||
      pageNumber >= Math.max(data.totalPages, 1)
    ) {
      throw new Error(INVALID_RESPONSE_MESSAGE);
    }

    totalElements = data.totalElements;
    totalPages = data.totalPages;
  } else if (typeof data.last !== 'boolean') {
    throw new Error(INVALID_RESPONSE_MESSAGE);
  }

  const last =
    totalPages === undefined
      ? data.last === true
      : pageNumber + 1 >= totalPages;

  if (
    (typeof data.last === 'boolean' && data.last !== last) ||
    (!last && tradeIds.length === 0)
  ) {
    throw new Error(INVALID_RESPONSE_MESSAGE);
  }

  return { tradeIds, size: data.size, last, totalElements, totalPages };
}

async function collectPages(
  expectedMemberId: string,
  signal: AbortSignal,
): Promise<{ memberId: string; tradeIds: number[] }> {
  const tradeIds = new Set<number>();
  let firstPage: ParticipationPage | undefined;

  for (let pageNumber = 0; pageNumber < MAX_TRADE_IDS; pageNumber += 1) {
    signal.throwIfAborted();
    assertCurrentMember(expectedMemberId);

    // Use the existing authenticated endpoint without a status filter. Its
    // normal display parser requires totals, so retain the raw last flag here.
    const params = new URLSearchParams({
      page: String(pageNumber),
      size: String(PAGE_SIZE),
    });
    const response = await authenticatedFetch(`/api/v1/trades/me?${params}`, {
      signal,
    });

    signal.throwIfAborted();
    assertCurrentMember(expectedMemberId);

    if (
      !response.ok ||
      !response.headers.get('content-type')?.includes('application/json')
    ) {
      throw new Error(INVALID_RESPONSE_MESSAGE);
    }

    const responseBody: unknown = await response.json();

    signal.throwIfAborted();
    assertCurrentMember(expectedMemberId);

    const page = parseParticipationPage(
      responseBody,
      pageNumber,
      expectedMemberId,
    );

    if (
      firstPage &&
      (page.size !== firstPage.size ||
        page.totalElements !== firstPage.totalElements ||
        page.totalPages !== firstPage.totalPages)
    ) {
      throw new Error(INVALID_RESPONSE_MESSAGE);
    }

    firstPage ??= page;
    const previousCount = tradeIds.size;
    page.tradeIds.forEach((tradeId) => tradeIds.add(tradeId));

    if (
      tradeIds.size > MAX_TRADE_IDS ||
      (!page.last && tradeIds.size === previousCount)
    ) {
      throw new Error(INVALID_RESPONSE_MESSAGE);
    }

    if (page.last) {
      if (
        page.totalElements !== undefined &&
        tradeIds.size !== page.totalElements
      ) {
        throw new Error(INVALID_RESPONSE_MESSAGE);
      }

      assertCurrentMember(expectedMemberId);

      return {
        memberId: expectedMemberId,
        tradeIds: [...tradeIds].sort((a, b) => a - b),
      };
    }
  }

  throw new Error(INVALID_RESPONSE_MESSAGE);
}

/**
 * Collects currently accessible own posts, including every trade status.
 * Deleted posts are not exposed by this API and cannot be reconstructed here.
 * JWT identity plus an accepted API request protects this UI from stale sessions;
 * these client-generated values are not a server-verifiable participation proof.
 */
export async function collectLaunchEventParticipation(
  expectedMemberId: string,
): Promise<{ memberId: string; tradeIds: number[] }> {
  assertCurrentMember(expectedMemberId);

  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error('교환글 확인 시간이 초과되었어요. 다시 시도해주세요.'));
      controller.abort();
    }, COLLECTION_TIMEOUT_MS);
  });

  try {
    // The shared token refresh request does not accept an AbortSignal. Racing
    // the deadline also prevents that request from leaving submission pending.
    return await Promise.race([
      collectPages(expectedMemberId, controller.signal),
      deadline,
    ]);
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}

import { readAccessToken } from '@/features/auth/authTokenStorage';
import { readMemberIdFromAccessToken } from '@/features/auth/readMemberIdFromAccessToken';

import {
  isLaunchEventDate,
  isLaunchEventEndpoint,
  LAUNCH_EVENT_ID,
  LAUNCH_EVENT_SCHEMA_VERSION,
  type LaunchEventMetadata,
} from './launchEventConfig';
import type { LaunchEventPlatform } from './launchEventPlatform';

export interface LaunchEventInput {
  submissionId: string;
  memberId: string;
  name: string;
  instagramId: string;
  tradeIds: number[];
  privacyConsent: true;
  rulesConsent: true;
  rulesVersion: string;
  participationPlatform?: LaunchEventPlatform;
}

export interface LaunchEventReceipt {
  submissionId: string;
  eventId: typeof LAUNCH_EVENT_ID;
  receivedAt: string;
}

const FAILURE_MESSAGE =
  '응모 접수 결과를 확인하지 못했어요. 입력 내용을 유지한 채 다시 시도해 주세요.';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeLaunchEventInstagramId(value: string): string {
  return value.trim().replace(/^@/, '').toLowerCase();
}

export function isLaunchEventInstagramId(value: string): boolean {
  return /^[a-z0-9._]{1,30}$/.test(normalizeLaunchEventInstagramId(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function requestJson(
  endpoint: string,
  init: RequestInit,
): Promise<Record<string, unknown>> {
  if (!isLaunchEventEndpoint(endpoint)) {
    throw new Error('이벤트 접수를 준비 중이에요. 잠시 후 다시 확인해 주세요.');
  }

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(FAILURE_MESSAGE));
    }, 60_000);
  });
  try {
    // 외부 요청 또는 응답 본문 읽기가 지연돼도 폼이 무한 대기하지 않는다.
    return await Promise.race([
      (async () => {
        const response = await fetch(endpoint, {
          ...init,
          credentials: 'omit',
          mode: 'cors',
          referrerPolicy: 'no-referrer',
          cache: 'no-store',
          // Apps Script ContentService의 googleusercontent 응답 이동을 허용한다.
          redirect: 'follow',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(FAILURE_MESSAGE);
        const text = await response.text();
        if (!text.trim() || text.length > 65_536)
          throw new Error(FAILURE_MESSAGE);
        const data: unknown = JSON.parse(text);
        if (!isRecord(data) || data.ok !== true) {
          throw new Error(FAILURE_MESSAGE);
        }
        return data;
      })(),
      timeout,
    ]);
  } catch {
    // 외부 응답 메시지나 개인정보를 화면/로그에 그대로 노출하지 않는다.
    throw new Error(FAILURE_MESSAGE);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLaunchEventMetadata(
  endpoint: string,
): Promise<LaunchEventMetadata> {
  const data = await requestJson(endpoint, { method: 'GET' });
  const privacy = data.privacy;
  if (
    data.eventId !== LAUNCH_EVENT_ID ||
    data.schemaVersion !== LAUNCH_EVENT_SCHEMA_VERSION ||
    data.authentication !== 'client-reported' ||
    typeof data.accepting !== 'boolean' ||
    typeof data.startAt !== 'string' ||
    typeof data.endAt !== 'string' ||
    !isLaunchEventDate(data.startAt) ||
    !isLaunchEventDate(data.endAt) ||
    Date.parse(data.startAt) >= Date.parse(data.endAt) ||
    typeof data.rulesVersion !== 'string' ||
    !data.rulesVersion.trim() ||
    !isRecord(privacy) ||
    typeof privacy.controller !== 'string' ||
    !privacy.controller.trim() ||
    typeof privacy.contact !== 'string' ||
    !privacy.contact.trim() ||
    typeof privacy.purpose !== 'string' ||
    !privacy.purpose.trim() ||
    !Array.isArray(privacy.items) ||
    privacy.items.length === 0 ||
    !privacy.items.every((item) => typeof item === 'string' && item.trim()) ||
    typeof privacy.retentionDays !== 'number' ||
    !Number.isInteger(privacy.retentionDays) ||
    privacy.retentionDays < 1 ||
    privacy.retentionDays > 365
  ) {
    throw new Error('이벤트 접수 설정을 확인하지 못했어요.');
  }
  return {
    eventId: LAUNCH_EVENT_ID,
    schemaVersion: LAUNCH_EVENT_SCHEMA_VERSION,
    authentication: 'client-reported',
    accepting: data.accepting,
    startAt: data.startAt,
    endAt: data.endAt,
    rulesVersion: data.rulesVersion,
    ...(isRecord(data.capabilities) &&
    data.capabilities.participationPlatform === true
      ? { capabilities: { participationPlatform: true as const } }
      : {}),
    privacy: {
      controller: privacy.controller,
      contact: privacy.contact,
      purpose: privacy.purpose,
      items: privacy.items as string[],
      retentionDays: privacy.retentionDays,
    },
  };
}

export async function submitLaunchEvent(
  input: LaunchEventInput,
  endpoint: string,
): Promise<LaunchEventReceipt> {
  if (!UUID_PATTERN.test(input.submissionId)) {
    throw new Error(
      '응모 번호를 확인하지 못했어요. 페이지를 다시 열어 주세요.',
    );
  }
  const submissionId = input.submissionId.toLowerCase();
  const name = input.name.trim();
  const instagramId = normalizeLaunchEventInstagramId(input.instagramId);
  if (
    !/^[1-9]\d*$/.test(input.memberId) ||
    !Number.isSafeInteger(Number(input.memberId)) ||
    name.length < 1 ||
    name.length > 80 ||
    !isLaunchEventInstagramId(input.instagramId) ||
    !Array.isArray(input.tradeIds) ||
    input.tradeIds.length < 1 ||
    input.tradeIds.length > 10_000 ||
    !input.tradeIds.every(
      (tradeId) => Number.isSafeInteger(tradeId) && tradeId > 0,
    ) ||
    new Set(input.tradeIds).size !== input.tradeIds.length ||
    input.privacyConsent !== true ||
    input.rulesConsent !== true ||
    (input.participationPlatform !== undefined &&
      !['web', 'android', 'ios', 'app-unknown'].includes(
        input.participationPlatform,
      )) ||
    !input.rulesVersion.trim()
  ) {
    throw new Error('응모 정보와 참여 활동을 다시 확인해 주세요.');
  }
  const accessToken = readAccessToken();
  if (
    !accessToken ||
    readMemberIdFromAccessToken(accessToken) !== input.memberId
  ) {
    throw new Error('로그인 계정이 변경되었어요. 로그인 상태를 확인해 주세요.');
  }
  // 사이트에서 조회한 회원번호와 글 목록을 직접 전달한다.
  // 접수 서버는 이 값의 진위를 검증하지 않는다. 로그인 토큰은 보내지 않는다.
  const data = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({
      eventId: LAUNCH_EVENT_ID,
      schemaVersion: LAUNCH_EVENT_SCHEMA_VERSION,
      submissionId,
      memberId: input.memberId,
      tradeIds: input.tradeIds,
      name,
      instagramId,
      privacyConsent: input.privacyConsent,
      rulesConsent: input.rulesConsent,
      rulesVersion: input.rulesVersion,
      ...(input.participationPlatform !== undefined
        ? { participationPlatform: input.participationPlatform }
        : {}),
    }),
  });
  if (
    data.eventId !== LAUNCH_EVENT_ID ||
    data.submissionId !== submissionId ||
    typeof data.receivedAt !== 'string' ||
    !isLaunchEventDate(data.receivedAt)
  ) {
    throw new Error(FAILURE_MESSAGE);
  }
  return {
    eventId: LAUNCH_EVENT_ID,
    submissionId,
    receivedAt: data.receivedAt,
  };
}

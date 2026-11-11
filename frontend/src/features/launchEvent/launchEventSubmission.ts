import {
  isLaunchEventDate,
  isLaunchEventEndpoint,
  LAUNCH_EVENT_ID,
  LAUNCH_EVENT_SCHEMA_VERSION,
  type LaunchEventMetadata,
} from './launchEventConfig';

export interface LaunchEventInput {
  submissionId: string;
  memberId: string;
  name: string;
  phone: string;
  reason: string;
  privacyConsent: true;
  rulesConsent: true;
  rulesVersion: string;
  photos?: { name: string; mimeType: string; data: string }[];
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
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(endpoint, {
      ...init,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(FAILURE_MESSAGE);
    const text = await response.text();
    if (!text.trim() || text.length > 65_536) throw new Error(FAILURE_MESSAGE);
    const data: unknown = JSON.parse(text);
    if (!isRecord(data) || data.ok !== true) {
      throw new Error(FAILURE_MESSAGE);
    }
    return data;
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
    accepting: data.accepting,
    startAt: data.startAt,
    endAt: data.endAt,
    rulesVersion: data.rulesVersion,
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
  // 키를 명시하여 호출자가 추가한 인증 토큰 등 임의 필드가 유출되지 않게 한다.
  const data = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({
      eventId: LAUNCH_EVENT_ID,
      schemaVersion: LAUNCH_EVENT_SCHEMA_VERSION,
      submissionId,
      memberId: input.memberId,
      name: input.name,
      phone: input.phone,
      reason: input.reason,
      privacyConsent: input.privacyConsent,
      rulesConsent: input.rulesConsent,
      rulesVersion: input.rulesVersion,
      photos:
        input.photos?.map(({ name, mimeType, data }) => ({
          name,
          mimeType,
          data,
        })) ?? [],
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

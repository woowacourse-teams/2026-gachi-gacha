import type { EventApplicationInput } from './eventApplicationType';

const DEFAULT_ERROR_MESSAGE = '이벤트 응모를 접수하지 못했습니다.';

export type SubmitEventApplication = (
  input: EventApplicationInput,
) => Promise<void>;

export async function submitEventApplication(
  input: EventApplicationInput,
  endpoint: string = __EVENT_APPLICATION_ENDPOINT__,
): Promise<void> {
  if (!endpoint.trim()) {
    throw new Error('이벤트 응모 접수를 준비하고 있어요.');
  }

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify(input),
      credentials: 'omit',
    });
  } catch {
    throw new Error(DEFAULT_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(DEFAULT_ERROR_MESSAGE);
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    return;
  }

  try {
    const responseBody: unknown = JSON.parse(responseText);

    if (
      typeof responseBody === 'object' &&
      responseBody !== null &&
      'ok' in responseBody &&
      responseBody.ok === false
    ) {
      const message =
        'message' in responseBody && typeof responseBody.message === 'string'
          ? responseBody.message
          : DEFAULT_ERROR_MESSAGE;

      throw new Error(message);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return;
    }

    throw error;
  }
}

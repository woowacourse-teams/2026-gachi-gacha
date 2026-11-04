export class ApiResponseParseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiResponseParseError';
  }
}

export function isApiResponseParseError(
  error: unknown,
): error is ApiResponseParseError {
  return error instanceof ApiResponseParseError;
}

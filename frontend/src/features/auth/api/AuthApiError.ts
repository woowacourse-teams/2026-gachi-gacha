export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

export function isUnauthorizedAuthApiError(
  error: unknown,
): error is AuthApiError {
  return error instanceof AuthApiError && error.status === 401;
}

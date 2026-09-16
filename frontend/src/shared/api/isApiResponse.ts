export function isApiResponse(
  value: unknown,
): value is { code: string; message: string; data?: unknown } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;

  return (
    typeof response.code === 'string' && typeof response.message === 'string'
  );
}

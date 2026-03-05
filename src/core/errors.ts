export class M365Error extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'M365Error';
  }
}

export class AuthError extends M365Error {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends M365Error {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends M365Error {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends M365Error {
  public retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends M365Error {
  constructor(message: string, statusCode = 500) {
    super(message, 'SERVER_ERROR', statusCode);
    this.name = 'ServerError';
  }
}

export function formatError(error: unknown): { message: string; code: string } {
  if (error instanceof M365Error) {
    return { message: error.message, code: error.code };
  }
  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.message.includes('aborted')) {
      return { message: 'Request timed out', code: 'TIMEOUT' };
    }
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return { message: `Network error: ${error.message}`, code: 'NETWORK_ERROR' };
    }
    return { message: error.message, code: 'UNKNOWN_ERROR' };
  }
  return { message: String(error), code: 'UNKNOWN_ERROR' };
}

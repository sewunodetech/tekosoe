/**
 * Every error that reaches the client has the same envelope:
 * { "error": { "code": "SNAKE_UPPER", "message": "...", "details": {} } }
 * Stack traces and internal messages never leave the process.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

export const errors = {
  validation: (details: Record<string, unknown>) =>
    new ApiError(400, "VALIDATION_ERROR", "Request validation failed", details),
  invalidAddress: () => new ApiError(400, "INVALID_ADDRESS", "Address is not valid"),
  invalidGroupId: () => new ApiError(400, "INVALID_GROUP_ID", "Group id is not valid"),
  invalidSignature: () =>
    new ApiError(401, "INVALID_SIGNATURE", "Signature could not be verified"),
  challengeNotFound: () =>
    new ApiError(401, "CHALLENGE_NOT_FOUND", "Challenge not found, used, or expired"),
  unauthorized: (code = "UNAUTHORIZED", message = "Authentication required") =>
    new ApiError(401, code, message),
  forbidden: (code: string, message: string) => new ApiError(403, code, message),
  notFound: (code = "NOT_FOUND", message = "Resource not found") =>
    new ApiError(404, code, message),
  conflict: (code: string, message: string) => new ApiError(409, code, message),
  payloadTooLarge: () =>
    new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body is too large"),
  tooManyRequests: (code: string, message: string) => new ApiError(429, code, message),
  internal: () => new ApiError(500, "INTERNAL_ERROR", "Something went wrong"),
  badGateway: (code: string, message: string) => new ApiError(502, code, message),
  serviceUnavailable: (code: string, message: string) =>
    new ApiError(503, code, message),
};

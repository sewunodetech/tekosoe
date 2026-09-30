import type { NextFunction, Request, Response } from "express";
import { isApiError } from "../lib/errors";
import type { Logger } from "../lib/logger";

function isZodError(
  value: unknown,
): value is { issues: { path: unknown[]; message: string }[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "issues" in value &&
    Array.isArray((value as { issues: unknown }).issues)
  );
}

interface BodyParserError {
  type?: string;
  status?: number;
  statusCode?: number;
}

/** Single error shape for every failure: { error: { code, message, details } }. */
export function errorHandler(logger: Logger) {
  return (error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (isApiError(error)) {
      if (error.status >= 500) {
        logger.error({ err: error, reqId: req.id, path: req.path }, error.message);
      }
      res.status(error.status).json({
        error: { code: error.code, message: error.message, details: error.details ?? {} },
      });
      return;
    }

    if (isZodError(error)) {
      const issues = error.issues.map((issue) => ({
        path: Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path),
        message: issue.message,
      }));
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: { issues },
        },
      });
      return;
    }

    const bodyError = error as BodyParserError;
    if (bodyError?.type === "entity.too.large" || bodyError?.status === 413) {
      res.status(413).json({
        error: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large", details: {} },
      });
      return;
    }
    if (bodyError?.type === "entity.parse.failed") {
      res.status(400).json({
        error: { code: "INVALID_JSON", message: "Request body is not valid JSON", details: {} },
      });
      return;
    }

    logger.error({ err: error, reqId: req.id, path: req.path }, "unhandled error");
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Something went wrong", details: {} },
    });
  };
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found", details: {} },
  });
}

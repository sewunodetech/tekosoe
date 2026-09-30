import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../lib/errors";

export function parseOrThrow<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    throw new ApiError(400, "VALIDATION_ERROR", "Request validation failed", { issues });
  }
  return result.data;
}

/**
 * Express 5 types path parameters as `string | string[]` (wildcard params are arrays);
 * every route here uses single-value params, so anything else is a validation error.
 */
export function pathParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "Request validation failed", {
      issues: [{ path: name, message: "path parameter must be a single value" }],
    });
  }
  return value;
}

/**
 * Zod validation for body and path params. Express 5 exposes req.query through a
 * getter, so query strings are validated inside the handler with parseOrThrow.
 */
export function validate(schemas: { body?: ZodType; params?: ZodType }): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = parseOrThrow(schemas.body, req.body ?? {});
      if (schemas.params) {
        req.params = parseOrThrow(schemas.params, req.params) as typeof req.params;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

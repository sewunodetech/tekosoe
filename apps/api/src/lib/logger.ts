import { pino, type Logger, type LoggerOptions } from "pino";

export type { Logger };

const REDACT_PATHS = [
  "req.headers.authorization",
  'req.headers["x-admin-key"]',
  "headers.authorization",
  'headers["x-admin-key"]',
  "authorization",
  'x-admin-key',
];

export function createLogger(options: { level?: string } = {}): Logger {
  const level =
    options.level ?? (process.env["NODE_ENV"] === "test" ? "silent" : "info");
  const loggerOptions: LoggerOptions = {
    level,
    redact: { paths: REDACT_PATHS, censor: "[redacted]" },
  };
  return pino(loggerOptions);
}

/** A logger that swallows everything — handy for unit tests. */
export function createSilentLogger(): Logger {
  return createLogger({ level: "silent" });
}

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const minLevel = (Bun.env.LOG_LEVEL as LogLevel) || "info";

const stdout = Bun.stdout.writer();
const stderr = Bun.stderr.writer();

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[minLevel];
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: LogLevel, message: string, meta?: object): string {
  const base = `[${formatTimestamp()}] ${level.toUpperCase()} ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    return `${base} ${JSON.stringify(meta)}\n`;
  }
  return `${base}\n`;
}

function log(level: LogLevel, message: string, meta?: object): void {
  if (!shouldLog(level)) return;

  const formatted = formatMessage(level, message, meta);
  const writer = level === "error" || level === "warn" ? stderr : stdout;
  writer.write(formatted);
}

export const logger = {
  debug: (message: string, meta?: object) => log("debug", message, meta),
  info: (message: string, meta?: object) => log("info", message, meta),
  warn: (message: string, meta?: object) => log("warn", message, meta),
  error: (message: string, meta?: object) => log("error", message, meta),
};

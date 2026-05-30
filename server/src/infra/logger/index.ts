// Re-export the legacy pino instance so old and new code share one
// logger (one set of redact rules, one pretty-print config, one log
// stream). Provides typed child loggers.

import type pino from 'pino';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const legacy = require('../../../utils/logger.js') as pino.Logger;

export const logger: pino.Logger = legacy;

export function childLogger(bindings: Record<string, unknown>): pino.Logger {
  return logger.child(bindings);
}

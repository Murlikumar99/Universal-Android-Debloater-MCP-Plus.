import pino from 'pino';

/**
 * CRITICAL MCP STDIO RULE:
 * All logs MUST be written strictly to stderr (fd 2), never stdout (fd 1),
 * so the JSON-RPC stdio transport stream is never corrupted.
 */
export const logger = pino(
  {
    name: 'android-debloater-mcp',
    level: process.env.LOG_LEVEL || 'info',
    redact: {
      paths: ['token', 'approvalToken', 'password', 'secret', 'headers.authorization', 'headers.cookie'],
      censor: '[REDACTED]',
    },
  },
  pino.destination(2)
);

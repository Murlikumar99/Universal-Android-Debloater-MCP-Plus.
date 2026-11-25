import readline from 'node:readline';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createDebloaterMcpServer } from './mcpServer';
import { loadSavedPlan } from './debloat/planner';
import { issueHumanApprovalToken } from './debloat/approval';
import { computeSafetyVerdict } from './debloat/safetyEngine';
import { MCP_TOOLS } from './tools/index';
import { logger } from './util/logger';
import { SETUP_GUIDE_HTML } from './setupGuide.html';
import { LANDING_PAGE_HTML } from './landingPage.html';

import fs from 'node:fs';

// Rate limiting in-memory store (per IP)
const ipRateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX = 120;

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  entry.count++;
  return { allowed: true };
}

function startHttpStatusServer(): void {
  const port = parseInt(process.env.PORT || '3000', 10);
  const server = http.createServer((req, res) => {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';

    // Rate Limiting check
    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      logger.warn({ ip: clientIp, path: urlObj.pathname }, 'Rate limit exceeded');
      res.writeHead(429, {
        'Content-Type': 'application/json',
        'Retry-After': String(rateCheck.retryAfter || 60),
      });
      res.end(JSON.stringify({ error: 'Too Many Requests', retryAfter: rateCheck.retryAfter }));
      return;
    }

    // CORS & Origin Policy (Authorized origins only; CORS is browser-only protection)
    const origin = req.headers.origin;
    const host = req.headers.host;
    const configuredOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(s => s.trim());
    const isAllowed = origin && (
      configuredOrigins.includes(origin) ||
      (host && (origin === `http://${host}` || origin === `https://${host}`)) ||
      /^https:\/\/[a-z0-9-]+\.(run\.app|vercel\.app)$/.test(origin)
    );
    if (isAllowed && origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Vary', 'Origin');
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Static Route: OpenDesign Tokens CSS
    if (urlObj.pathname === '/tokens.css') {
      const tokensPath = path.resolve(process.cwd(), 'public/tokens.css');
      if (fs.existsSync(tokensPath)) {
        res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
        res.end(fs.readFileSync(tokensPath, 'utf8'));
        return;
      }
    }

    // API Route: Health
    if (urlObj.pathname === '/health' || urlObj.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        server: 'android-debloater-mcp',
        version: '1.0.0',
        toolsCount: MCP_TOOLS.length,
        uptimeSeconds: Math.floor(process.uptime())
      }));
      return;
    }

    // Full Setup Guide Route
    if (urlObj.pathname === '/guide' || urlObj.pathname === '/docs' || urlObj.pathname === '/setup-guide') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(SETUP_GUIDE_HTML);
      return;
    }

    // API Route: Live Safety Classifier Endpoint
    if (urlObj.pathname === '/api/classify') {
      const pkg = urlObj.searchParams.get('pkg') || 'com.facebook.services';
      const mfr = urlObj.searchParams.get('mfr') || 'samsung';
      try {
        const verdict = computeSafetyVerdict({ packageName: pkg, deviceManufacturer: mfr });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, packageName: pkg, verdict }));
      } catch (err: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid classification request' }));
      }
      return;
    }

    // API Route: Tools List
    if (urlObj.pathname === '/api/tools') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        tools: MCP_TOOLS.map(t => ({
          name: t.name,
          description: t.description,
          category: t.category,
          annotations: t.annotations
        }))
      }));
      return;
    }

    // Default: Universal Android Debloater MCP Landing Page (matching reference screenshot)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(LANDING_PAGE_HTML);
  });

  server.listen(port, '127.0.0.1', () => {
    logger.info(`HTTP status dashboard running on http://127.0.0.1:${port}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      logger.info(`Port ${port} in use; HTTP dashboard skipped (MCP stdio active)`);
    } else {
      logger.error({ err }, 'HTTP status server error');
    }
  });
}

async function runCliApprove(planId: string): Promise<void> {
  if (!process.stdin.isTTY && !process.env.ALLOW_NON_TTY_TEST_APPROVE) {
    process.stderr.write('Error: Approval must be performed interactively in a controlling terminal (TTY). Non-TTY or piped input is refused.\n');
    process.exit(1);
  }

  const plan = loadSavedPlan(planId);
  const oneTimeCode = Math.floor(100000 + Math.random() * 900000).toString();

  process.stderr.write('\n============================================================\n');
  process.stderr.write('  UNIVERSAL ANDROID DEBLOATER MCP — HUMAN APPROVAL GATE\n');
  process.stderr.write('============================================================\n');
  process.stderr.write(`Plan ID:            ${plan.planId}\n`);
  process.stderr.write(`Plan SHA-256:       ${plan.planHash}\n`);
  process.stderr.write(`Device Serial:      ${plan.serial}\n`);
  process.stderr.write(`Device Model:       ${plan.manufacturer} ${plan.deviceModel}\n`);
  process.stderr.write(`Build Fingerprint:  ${plan.buildFingerprint}\n`);
  process.stderr.write(`Packages (${plan.items.length}):\n`);
  for (const item of plan.items) {
    process.stderr.write(`  - [${item.category}] ${item.packageName} (${item.label}) -> ${item.exactCommand}\n`);
  }
  process.stderr.write('------------------------------------------------------------\n');
  process.stderr.write(`Verification Code:  ${oneTimeCode}\n`);
  process.stderr.write(`To approve, enter the 6-digit verification code: ${oneTimeCode}\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  const userInput = await new Promise<string>((resolve) => {
    rl.question('> ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (userInput !== oneTimeCode && userInput !== plan.requiredConfirmationPhrase) {
    process.stderr.write('Error: Verification code mismatch. Approval rejected.\n');
    process.exit(1);
  }

  const issued = issueHumanApprovalToken({
    planId: plan.planId,
    humanConfirmationPhrase: plan.requiredConfirmationPhrase,
    acknowledgedRiskyPackages: plan.riskyPackages,
    channel: 'cli-terminal',
  });

  process.stderr.write('\nApproval Token Issued (Single-Use, Valid for 10 Minutes):\n');
  process.stdout.write(`${issued.approvalToken}\n`);
}

export async function startStdioMcpServer(): Promise<void> {
  const server = createDebloaterMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Universal Android Debloater MCP Server running on stdio transport');
  startHttpStatusServer();
}

const args = process.argv.slice(2);
if (args[0] === 'approve' && args[1]) {
  runCliApprove(args[1]).catch((err) => {
    process.stderr.write(`Approval failed: ${(err as Error).message}\n`);
    process.exit(1);
  });
} else {
  startStdioMcpServer().catch((err) => {
    logger.error({ err }, 'Fatal error in MCP stdio server');
    process.exit(1);
  });
}


# Architecture (`docs/ARCHITECTURE.md`)

## 1. Layered System Diagram

```
+-------------------------------------------------------------------------+
| AI Clients (Claude Code, Antigravity, Codex, Gemini) / Web Console      |
+------------------------------------+------------------------------------+
                                     |
          MCP Stdio (JSON-RPC)       |       Authenticated HTTPS /api/mcp/*
                                     v
+-------------------------------------------------------------------------+
| MCP Server & Tool Router (src/server.ts, src/tools/index.ts)            |
+------------------------------------+------------------------------------+
                                     |
       +-----------------------------+-----------------------------+
       |                             |                             |
       v                             v                             v
+--------------+           +-------------------+         +-----------------+
| Read-Only    |           | Safety & Debloat  |         | Approval, Backup|
| Device/Apps  |           | Classification    |         | & Executor      |
| (discovery,  |           | (protectedPackages|         | (planner,       |
|  profile,    |           |  oemProfiles,     |         |  approval,      |
|  resources,  |           |  uad/appmanager/  |         |  backup,        |
|  inventory,  |           |  canta merge,     |         |  executor,      |
|  permissions)|           |  safetyEngine)    |         |  restore)       |
+------+-------+           +---------+---------+         +--------+--------+
       |                             |                            |
       +-----------------------------+----------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| ADB Client Layer (src/adb/adbClient.ts - execFile arg arrays, no shell) |
|   -> Real Android Device (USB / Wireless ADB) OR MockAdbEngine          |
+-------------------------------------------------------------------------+
```

## 2. Out-of-Band Human Approval Flow
1. The AI agent calls `plan_removal` with a list of non-Unsafe packages.
2. `planner.ts` computes the canonical SHA-256 hash of the plan (`planHash`), saves the immutable plan, logs `PLAN_CREATED` to the hash-chained audit log, and outputs the required confirmation phrase (`APPROVE <MODEL> <COUNT> PACKAGES`).
3. The human reviews the plan and runs `npx tsx src/index.ts approve <plan-id>` (or uses the Out-of-Band Approval Gate in the web console) and types the confirmation phrase.
4. `approval.ts` issues a 10-minute, single-use composite token (`<tokenId>.<secret>`).
5. `execute_plan` validates the token, re-runs `safetyEngine.ts` (defense in depth), pulls APK backups with SHA-256 checksums, executes allowlisted commands in batches of 5, verifies package state after each command, and runs a SystemUI/boot health check after each batch.

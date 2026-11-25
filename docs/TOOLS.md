# MCP Tools Schema Reference (`docs/TOOLS.md`)

All 23 MCP tools registered in `src/tools/index.ts` accept an optional `serial` parameter (strictly required when more than one authorized device is connected) and return structured JSON alongside a concise human-readable summary.

- **Read-Only Tools (`readOnlyHint: true`)**:
  - `list_devices`, `get_device_profile`, `get_resource_usage`, `list_installed_apps`, `get_app_details`, `audit_permissions`, `sync_debloat_lists`, `get_list_status`, `lookup_package`, `classify_apps`, `explain_classification`, `list_backups`, `verify_audit_log`, `generate_report`
- **Wireless ADB Helpers**:
  - `adb_pair`, `adb_connect`, `adb_disconnect`
- **Non-Destructive Planning & Backup Tools (`readOnlyHint: true`)**:
  - `create_backup`, `plan_removal`, `plan_restore`, `generate_restore_script`
- **Approval-Gated Mutating Tools (`destructiveHint: true`)**:
  - `execute_plan` (requires single-use out-of-band human approval token; defaults to `dryRun: true`)
  - `execute_restore` (restores packages via allowlisted `install-existing` and `pm enable`)

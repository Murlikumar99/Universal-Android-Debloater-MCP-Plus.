# Changelog

## [0.1.0] - 2026-11-04
### Added
- Phase 1: Cross-platform ADB locator (`adbLocator.ts`), `execFile` argument-array client (`adbClient.ts`), deterministic multi-OEM `mockAdb.ts`, and `list_devices` / `get_device_profile` MCP tools.
- Phase 2: RAM, swap, `/data` storage, battery, and top process telemetry (`get_resource_usage`), plus `--user 0` package inventory (`list_installed_apps`, `get_app_details`).
- Phase 3: Runtime permission risk auditor (`audit_permissions`) flagging system apps with unusual grants.
- Phase 4: Pinned-SHA debloat list synchronization (`sync_debloat_lists`, `get_list_status`, `lookup_package`) integrating UAD-NG, MuntashirAkon AppManager, and Canta with conservative conflict resolution.
- Phase 5: Manufacturer-aware Safety Engine (`classify_apps`, `explain_classification`) and hard-protected package rules (`data/protected-packages.json`, `data/oem-profiles.json`).
- Phase 6: Immutable SHA-256 removal planner (`plan_removal`), out-of-band human approval token gate (`approval.ts`), SHA-256 verified APK backup (`create_backup`), allowlisted executor (`execute_plan`), and cross-platform restoration (`plan_restore`, `execute_restore`, `generate_restore_script`).
- Phase 7 & 8: Append-only SHA-256 hash-chained JSONL audit log (`verify_audit_log`), multi-sample before/after reports (`generate_report`), OpenDesign web control console with defense-in-depth API security, client setup scripts, and CI/CD workflows.

# Safety Policy & Engine Specification (`docs/SAFETY.md`)

## 1. Safety Verdict Categories
- **`Safe`**: Documented as safe to remove by at least one verified upstream list with no conflicting conservative rating.
- **`Probably Safe`**: Removable for most users but may disable an optional OEM feature (themes, cloud backup, companion sync).
- **`Risky`**: Unknown packages (not in any list), unlisted OEM namespace packages, or packages flagged as `Expert`/`caution`. Requires explicit `acknowledgeRisky: true` in planning and per-item human acknowledgement.
- **`Unsafe`**: Terminal block. Includes `data/protected-packages.json` exact/prefix/regex rules, OEM `alwaysUnsafe` rules, packages sharing a privileged `sharedUserId` (`android.uid.system`, etc.), active role holders (`HOME`, `DIALER`, `SMS`), active keyboards (`ime list -a`), and enabled accessibility services.

## 2. Exhaustive Command Allowlist
`src/debloat/executor.ts` enforces the following exhaustive allowlist:
- `pm uninstall -k --user 0 <package>`
- `pm disable-user --user 0 <package>`
- `cmd package install-existing --user 0 <package>`
- `pm install-existing --user 0 <package>`
- `pm enable --user 0 <package>`

Why `-k` is mandatory: For system apps located on read-only partitions (`/system`, `/product`, `/system_ext`, `/vendor`), `pm uninstall -k --user 0` unlinks the package for User 0 while preserving data and keeping the base APK on the system image, enabling instant restoration via `cmd package install-existing --user 0 <package>`.

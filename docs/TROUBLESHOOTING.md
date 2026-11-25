# Troubleshooting & Recovery Guide (`docs/TROUBLESHOOTING.md`)

## 1. Common ADB Connection Issues
- **`DEVICE_UNAUTHORIZED`**: Unlock your phone screen, unplug and replug the USB cable, check "Always allow from this computer", and tap **Allow**.
- **`adb server version doesn't match`**: Ensure only one copy of `adb` is running (`adb kill-server && adb start-server`).
- **Windows USB Drivers**: Install the official Google USB Driver or OEM USB driver (Samsung Android USB Driver, Xiaomi USB Driver).

## 2. Emergency Package Restoration
If a removed or disabled package broke a feature:
1. Run the generated restoration script in `.uad-mcp-data/restore-scripts/restore-<timestamp>.sh` (or `.ps1` on Windows).
2. Or manually reinstall any user-0 removed system package via ADB:
   ```bash
   adb shell cmd package install-existing --user 0 <package-name>
   adb shell pm enable --user 0 <package-name>
   ```
3. **Last Resort**: If the device cannot boot into the launcher but ADB is reachable, run `execute_restore` with `restoreAllFromAuditLog: true`. If ADB is unreachable, boot into Android Recovery and perform a factory data reset (which restores all `--user 0` system packages from `/system`, though unbacked-up personal data is erased).

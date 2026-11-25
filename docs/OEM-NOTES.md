# OEM Quirks & Developer Option Notes (`docs/OEM-NOTES.md`)

## 1. Xiaomi / Redmi / POCO (MIUI & HyperOS)
- You must enable **both** `USB debugging` AND `USB debugging (Security settings)` in Developer Options (requires a SIM card and Mi Account sign-in on most global/CN builds) to run `pm disable-user` or `pm uninstall`.
- **Never remove**: `com.miui.securitycenter`, `com.miui.securitycore`, `com.lbe.security.miui`, `com.xiaomi.finddevice`, or `com.xiaomi.account`. Removing these causes an immediate bootloop.

## 2. Samsung (One UI)
- **Never remove**: `com.osp.app.signin` (Samsung Account), `com.samsung.android.knox.*`, `com.sec.imsservice` (VoLTE/Wi-Fi Calling), or `com.samsung.android.biometrics.app.setting`.
- Removing `com.samsung.android.scloud` disables Smart Switch backups.

## 3. OPPO / Realme / OnePlus (ColorOS / Realme UI / OxygenOS)
- Scroll to the bottom of **Developer Options** and enable **Disable permission monitoring**; otherwise ADB `pm` commands may return `SecurityException`.

## 4. Vivo / iQOO — OriginOS (OriginOS 3, 4, 5)
- **Enabling Developer Options**:
  1. Open **Settings > System management > About phone** (or **Settings > More settings > About phone**).
  2. Tap **Software version** 7 times.
  3. Open **Settings > System management > Developer options** and turn ON **USB debugging**.
  4. Allow the prompt for USB installation authorization.
- **Critical Protected Unsafe Packages (Never Touch)**:
  - `com.bbk.account` (Vivo Account): Removing causes boot failure, cloud lockout, or setup crash.
  - `com.vivo.permissionmanager`: Vivo core runtime permission controller.
  - `com.iqoo.secure` / `com.vivo.secure` (iManager): Security core.
  - `com.vivo.launcher` / `com.bbk.launcher2` (Atomic Desktop): Do not disable unless an alternative launcher is set.
  - `com.vivo.ups`: Push notification routing service.
  - `com.vivo.fingerprint` / `com.vivo.faceunlock`: Biometric authentication services.
- **Caution Packages**:
  - `com.vivo.abe` (Abnormal Behavior Engine): Vivo's AI thermal and power scheduling daemon. Can be frozen for extra performance, but may alter dynamic refresh rate and frame stabilization in games.
  - `com.vivo.weather`: Powers OriginOS Atomic climate cards and lock-screen widgets.
  - `com.vivo.assistant`: Jovi Voice Assistant and smart suggestion cards.
  - `com.bbk.theme`: iTheme store; required if you want to apply custom OriginOS fonts or icon packs.
  - `com.vivo.appstore`: V-Appstore; required for official OTA updates of pre-installed Vivo apps.
- **Safe Bloat & Telemetry to Disable**:
  - `com.android.bbklog` (System Debug Logger — heavy background disk writes).
  - `com.bbk.iqoo.logsystem` (iQOO Diagnostic & Log Uploader).
  - `com.vivo.nps` (Experience Assessment & Survey telemetry).
  - `com.vivo.epm` (Exception Policy Manager telemetry).
  - `com.vivo.networkimprove` (Network signal drop and telemetry logger).
  - `com.vivo.browser` (Vivo stock browser).
  - `com.vivo.game` (Vivo Game Center promo store).
  - `com.baidu.duersdk.opensdk` (Baidu SDK voice plugin on Chinese ROMs).
  - `com.baidu.input_vivo` (Baidu Chinese Keyboard — ensure Gboard is active first).

## 5. Vivo / iQOO — FuntouchOS (Global)
- Vivo Global devices running FuntouchOS protect `com.bbk.account` and `com.vivo.permissionmanager`.
- Excess telemetry services (`com.android.bbklog`, `com.vivo.nps`, `com.vivo.browser`) can be disabled using standard `pm disable-user --user 0`.

## 6. Android TV & Google TV (CleanYourTV Mode)
- Connect via Wi-Fi (`adb connect <TV-IP>:5555`).
- Never disable `com.google.android.apps.mediashell` (Chromecast built-in), `com.google.android.tv.remote.service` (Remote), or `com.android.tv.settings`.
- Safe to disable: `com.google.android.tvrecommendations` (sponsored ad channels), `com.google.android.videos` (movie store ads), and `com.samba.tv` (ACR viewing tracking).

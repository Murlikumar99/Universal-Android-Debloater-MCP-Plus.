# Contributing Guide (`CONTRIBUTING.md`)

## 1. Proposing Protected-Package Rules
- Hard-protected rules live in `data/protected-packages.json`.
- Any package whose removal can cause a bootloop, break cellular/IMS calling, disable lockscreen biometrics, remove the active keyboard/launcher, or break OEM account activation must be added to `exactPackages` or `prefixPatterns`.
- Add a unit test in `test/unit/core.test.ts` verifying that `computeSafetyVerdict` returns `Unsafe`.

## 2. Adding OEM Profiles
- Edit `data/oem-profiles.json` to add manufacturer detection properties, namespaces, `alwaysUnsafe` packages, and `cautionPackages`.

## 3. Running Quality Checks Before Submitting a PR
```bash
npm run lint
npm run typecheck
npm test
npm run build
```

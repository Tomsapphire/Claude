# DocScan: notes for Claude

Offline Android document scanner (Kotlin, Compose, Material 3). Before changing anything,
read `docs/PROJECT_BRIEF.md` (the requirements) and `docs/HANDOFF.md` (status, decisions,
next milestone).

## Setup and checks

- Fresh machine: `bash scripts/cloud-setup.sh` (Android SDK, `local.properties`, Maven
  Central mirror). Safe to re-run.
- Before every commit, all of these must pass:
  `./gradlew assembleDebug lintDebug testDebugUnitTest :core:domain:test`
- Screenshots of screens: `./gradlew recordRoborazziDebug`, then look at
  `app/build/outputs/roborazzi/*.png` yourself before sharing them.
- There is no emulator in cloud containers; say which behaviour still needs a real device.

## Conventions

- Work milestone by milestone; one commit per milestone, pushed only when the checks pass.
- Every user-visible string goes in `values/strings.xml` and `values-iw/strings.xml`.
  Check RTL in a Hebrew screenshot for any new screen.
- Screens: stateless `XxxScreen(state, callbacks)` + `XxxRoute` wired to a `@HiltViewModel`
  exposing one `StateFlow`. Logic that does not need Android goes in `core:domain`.
- Never add the `INTERNET` permission or a library that needs the network.
- Library versions only in `gradle/libs.versions.toml`, latest stable.
- Touch targets ≥ 48dp, content descriptions on icon-only buttons, decorative images get
  `contentDescription = null`.

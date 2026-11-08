# DocScan: handoff notes

Everything needed to continue the project without the original conversation: where the code
is, what is done, what was decided and why, and what comes next. Requirements are in
[PROJECT_BRIEF.md](PROJECT_BRIEF.md).

## Where things are

- Repository: `Tomsapphire/Claude` on GitHub, project folder `docscan-android/`.
- Branch: `claude/lucid-gates-0ruwju`. The repository's default branch holds unrelated
  WordPress work, so check this branch out (or merge it) before continuing.
- App id and package: `com.tomsapphire.docscan`. Working name: DocScan.

## Milestones

| # | Scope | State |
|---|---|---|
| 1 | Project setup, theme, navigation, home screen with empty state | Done (commit `e635fec`) |
| 2 | Camera: live edge detection overlay, capture, auto-capture, blur warning | Next |
| 3 | Perspective crop, corner adjustment with loupe, filters, gallery import | Planned |
| 4 | Multi-page sessions, storage, document list and viewer | Planned |
| 5 | Annotations with undo/redo, OCR | Planned |
| 6 | Signatures: pad, from photo, typed; encrypted storage; placement | Planned |
| 7 | PDF/JPG/PNG export, share, save, print, settings, biometric lock | Planned |
| 8 | Polish, RTL review, accessibility, tablets, tests, README | Planned |

Working agreement with the owner: one commit per milestone, pushed when the build, lint and
all tests pass, with screenshots of new screens shared for review. The owner was asked to
review Milestone 1's visual direction (colours, font, layout) before Milestone 2 started; no
answer had been given at handoff, so confirm with them first.

## Decisions so far

### Toolchain (latest stable at the time, November 2026)
AGP 9.5.0 (built-in Kotlin, so no `kotlin-android` plugin), Kotlin 2.4.21, KSP 2.3.13,
Gradle 9.8.2, compile/target SDK 37 (Android 17), min SDK 26, JDK 17 bytecode. Compose BOM
2026.09.00, Material 3 1.4.0, Navigation 2.10.2, Room 2.8.5, Hilt 2.60.1, DataStore 1.3.0,
Coil 3.6.3. Tests: JUnit 4, Robolectric 4.17 (tests pin `sdk = [36]`), Roborazzi 1.77.0,
Turbine. All versions live in `gradle/libs.versions.toml`.

### Design
- **Material 3 Expressive**: the stable 1.4.0 release keeps expressive components and
  `MotionScheme.expressive()` internal; they are public only in 1.5 (beta at the time). The
  app stays on stable and approximates the look in `ui/theme`: spring motion
  (`DocScanMotion`), rounder shapes, heavier display/headline type. Moving to 1.5 later should
  only need a version bump plus swapping in the real components.
- **Colour**: dynamic colour on Android 12+. Elsewhere a brand scheme generated from seed
  `#2F5DA8` (Material "content" scheme) in standard, medium and high contrast, chosen from the
  Android 14+ contrast setting. Regenerate with `scripts/generate_color_schemes.py`.
- **Type**: Rubik variable font (Latin and Hebrew, OFL) for the whole scale.
- **Hebrew**: resources in `values-iw` (the legacy code Android resolves for Hebrew).
  `generateLocaleConfig` enables the Android 13+ per-app language picker.
- **Navigation**: Navigation Compose (not Navigation 3, because the brief names Navigation
  Compose) with `@Serializable` routes, shared-axis X transitions and predictive back.

### Architecture
- Modules: `app` (UI, ViewModels, navigation), `core:domain` (pure Kotlin JVM),
  `core:data` (Room, DataStore, Hilt bindings).
- Screens are a stateless `XxxScreen(state, callbacks)` plus an `XxxRoute` that collects
  the `@HiltViewModel`'s `StateFlow`. Search text lives in Compose state in the ViewModel so
  typing never races the asynchronous pipeline.
- Room schema version 1 holds only `documents` (no pages yet). The app is unreleased, so v1
  may still be rewritten in Milestone 4 rather than migrated.

### Plans for coming milestones
- **Image processing (M2–M3)**: new module `core:imageprocessing` as a pure Kotlin JVM
  module written against the OpenCV Java API. It compiles against `org.openpnp:opencv`
  (4.9.0-0, desktop build with native libraries) as `compileOnly` and uses it for JVM unit
  tests on synthetic images. The app ships the Android AAR `org.opencv:opencv`. Prefer the
  4.x line (4.14.0) to keep API parity with the desktop build; check 5.0 compatibility before
  adopting it. Bitmap and Mat conversion stays in the Android layer.
- **OCR (M5)**: an `OcrEngine` interface. ML Kit's on-device recognizer has no Hebrew
  (only Latin, Chinese, Devanagari, Japanese and Korean), so: ML Kit `text-recognition`
  (the bundled model, not the Play Services variant, so nothing downloads) for Latin, and
  Tesseract4Android 4.8.0 from JitPack with bundled `heb` and `eng` traineddata
  (tessdata_fast, from raw.githubusercontent.com) for Hebrew.
- **PDF (M7)**: PdfBox-Android 2.0.27.0, because the searchable-PDF text layer needs
  invisible text, which Android's `PdfDocument` cannot write. Embed a Hebrew-capable font.
- **Signatures (M6)**: encrypt stored signature images with an Android Keystore AES-GCM key.
- **Biometric (M7)**: `androidx.biometric` needs a `FragmentActivity`, so `MainActivity`
  will change base class then.

### Privacy
- No `INTERNET` permission. Keep it that way: every library must work offline.
- `allowBackup="false"` and `data_extraction_rules.xml` exclude all data from cloud backup
  and device-to-device transfer.

## Build environment notes

- Run `scripts/cloud-setup.sh` on a fresh machine. It installs the Android SDK (platform
  37.0, build-tools 37.0.0 and 36.0.0, platform-tools), writes `local.properties` and adds a
  Gradle init script.
- Maven Central answers HTTP 429 (rate limit) to shared cloud IPs. The init script resolves
  Maven Central artifacts from Google's official mirror
  (`maven-central.storage-download.googleapis.com`), including Robolectric's own downloads.
  This is machine-level only; the project keeps the standard `mavenCentral()`.
- Robolectric on JDK 17+ needs `--add-opens java.base/java.io` and `--add-exports
  java.base/jdk.internal.access`; both are already in the module build files.
- Cloud containers have no KVM, so no emulator. Verify with build, lint, unit and Robolectric
  tests, and Roborazzi screenshots (`./gradlew recordRoborazziDebug`, output in
  `app/build/outputs/roborazzi/`). Camera, auto-capture and biometrics need a real device.
- Gradle's checksum file (`downloads.gradle.org`) was unreachable, so the wrapper has no
  `distributionSha256Sum`. Add it when it can be checked against Gradle's published value.

### Network hosts a cloud environment needs
With "Allow package managers" on (Maven Central, Gradle Plugin Portal):
`dl.google.com`, `maven.google.com`, `jitpack.io`, `github.com`, `raw.githubusercontent.com`,
`services.gradle.org`, `release-assets.githubusercontent.com`,
`maven-central.storage-download.googleapis.com`.

## Next step: Milestone 2

Camera screen replacing the placeholder in `ui/scanner`:
- CameraX `Preview` + `ImageAnalysis` (reduced resolution, background executor) +
  `ImageCapture` with `CAPTURE_MODE_MAXIMIZE_QUALITY`; tap-to-focus, focus before capture,
  torch toggle, haptic feedback on capture.
- Camera permission with a clear rationale screen, and recovery when it is permanently denied.
- OpenCV detector: grayscale → blur → Canny → contours → largest convex quadrilateral;
  corners smoothed across frames; animated polygon overlay mapped from analysis to preview
  coordinates.
- Auto-capture when a document is detected and stable for about one second, with a manual
  toggle; blur check by Laplacian variance with a retake prompt.
- Unit tests for the detector (synthetic rotated pages on textured backgrounds), corner
  smoothing and the stability tracker; ViewModel tests; English and Hebrew strings.

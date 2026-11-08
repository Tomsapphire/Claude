# DocScan

An offline Android document scanner with editing and e-signatures, written in Kotlin with
Jetpack Compose and Material 3. Everything runs on the device: the app does not request the
`INTERNET` permission, so no scan, extracted text or signature can leave the phone.

## Status

| Milestone | Scope | State |
|---|---|---|
| 1 | Project setup, theme, navigation, home screen | ✅ Done |
| 2 | Camera with live edge detection and capture | Planned |
| 3 | Perspective crop, corner adjustment, enhancement filters | Planned |
| 4 | Multi-page sessions, storage, document list and viewer | Planned |
| 5 | Annotations, undo/redo, OCR (English and Hebrew) | Planned |
| 6 | Signatures: draw, photo, typed; placement | Planned |
| 7 | PDF/JPG/PNG export, sharing, printing, settings, biometric lock | Planned |
| 8 | Polish, accessibility, tests, documentation | Planned |

Project documents: [the original brief](docs/PROJECT_BRIEF.md) and
[handoff notes](docs/HANDOFF.md) (decisions, status, next steps).

## Requirements

- JDK 17 or newer
- Android SDK with platform 37 (Android 17); Android Studio installs it on first sync
- Devices: Android 8.0 (API 26) and newer

On a fresh Linux machine or cloud container, `bash scripts/cloud-setup.sh` installs the SDK
and configures Gradle.

## Build and test

```bash
./gradlew assembleDebug          # debug APK in app/build/outputs/apk/debug
./gradlew testDebugUnitTest :core:domain:test   # unit, Robolectric and screenshot tests
./gradlew lintDebug              # Android lint
./gradlew recordRoborazziDebug   # render screens to app/build/outputs/roborazzi/*.png
```

Install on a connected device with `./gradlew installDebug`.

## Architecture

Clean Architecture with MVVM and unidirectional data flow, in a single activity.

```
app/            Compose UI, navigation, ViewModels, Hilt entry points
core/domain/    Pure Kotlin: models, repository interfaces, use cases (no Android)
core/data/      Room database, DataStore preferences, repository implementations
```

Planned for later milestones: `core/imageprocessing` (OpenCV pipeline) and OCR engines behind
an `OcrEngine` interface in `core/data`.

- **UI**: each screen has a stateless `XxxScreen(state, callbacks)` composable and a
  `XxxRoute` that connects it to its `@HiltViewModel`. ViewModels expose one `StateFlow`
  of immutable UI state.
- **Domain**: use cases hold logic that should be unit-tested without Android, such as
  search (case-, accent- and niqqud-insensitive, Hebrew final letters folded) and
  locale-aware sorting.
- **Data**: Room for documents, DataStore for preferences, both behind domain interfaces
  bound in `DataModule`.
- **Navigation**: Navigation Compose with type-safe `@Serializable` routes, shared-axis
  transitions and predictive back.

## Design

- Material 3 with dynamic color on Android 12+, and a brand scheme generated from seed
  `#2F5DA8` (standard, medium and high contrast) elsewhere.
- Rubik, a variable font that covers Latin and Hebrew, for the whole type scale.
- Edge-to-edge layout, splash screen, themed (monochrome) launcher icon.
- English and Hebrew, with full RTL support and Android 13+ per-app language selection.
- Adaptive grid that adds columns on tablets, foldables and landscape.

Material 3's Expressive components (`MaterialExpressiveTheme`, `FloatingToolbar`, etc.)
are public only in the 1.5 line, which is still in beta. The app stays on the stable 1.4
release and approximates expressive motion and shapes in `ui/theme`, so switching later is a
version bump.

## Privacy

- No `INTERNET` permission.
- Backups and device-to-device transfer are disabled for all app data
  (`allowBackup="false"` and `data_extraction_rules.xml`).

## Licenses

Rubik font: SIL Open Font License 1.1 (`app/src/main/assets/licenses/rubik-OFL.txt`).

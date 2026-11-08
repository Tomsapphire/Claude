# DocScan: original project brief

This is the product brief the project was started from, kept verbatim so any contributor
(human or AI) works to the same requirements. Decisions taken since are in
[HANDOFF.md](HANDOFF.md).

---

You are building a production-quality Android document scanning app with e-signature and
editing features. Before writing any code, read this entire brief, propose a short
implementation plan with milestones, and wait for my approval. Then build it milestone by
milestone, making sure the project compiles and runs after each one.

## 1. Platform & Tech Stack
- Native Android, Kotlin only.
- UI: Jetpack Compose with Material 3 (use Material 3 Expressive components and motion where available).
- minSdk 26, targetSdk/compileSdk = latest stable.
- Architecture: Clean Architecture + MVVM (or MVI), single-activity, Navigation Compose.
- DI: Hilt. Async: Coroutines + Flow. Local storage: Room + app-private file storage.
- Camera: CameraX.
- Image processing: OpenCV for Android (edge detection, perspective transform, enhancement).
- OCR: ML Kit Text Recognition (on-device, supports Latin and Hebrew text where possible; if Hebrew isn't supported on-device, design the OCR layer behind an interface so another engine can be swapped in).
- PDF: generate and edit PDFs (Android PdfDocument or PdfBox-Android).
- Use the latest stable versions of all libraries via a Gradle version catalog (libs.versions.toml).

## 2. Design & UI (modern, premium feel)
- Follow the latest Material 3 / Material You guidelines: dynamic color (Android 12+), light/dark theme, rounded shapes, expressive typography.
- Edge-to-edge layout with proper insets handling, predictive back gesture support.
- Smooth animations and transitions (shared element transitions between document list and document viewer, animated content changes, haptic feedback on capture).
- Clean, minimal home screen: grid/list of scanned documents with thumbnails, search, sort, and a prominent floating "Scan" button.
- Bottom sheets for actions, snackbars with undo for destructive actions.
- Fully support RTL layouts (Hebrew) and LTR. All strings in strings.xml with English and Hebrew translations.
- Accessibility: content descriptions, minimum touch targets, good contrast.
- Responsive on phones and tablets/foldables.

## 3. Smart Document Detection & Auto-Crop
- Live camera preview with real-time document edge detection: draw an animated polygon overlay on the detected document borders.
- Detection pipeline (OpenCV): grayscale → blur → Canny edges → contours → find largest 4-point quadrilateral. Run on a background thread at a reduced resolution for performance; smooth the detected corners across frames to avoid jitter.
- Auto-capture mode: when the document is detected and the camera is stable for ~1 second, capture automatically (with a toggle for manual capture).
- After capture, apply a perspective transform (warp) to produce a flat, rectangular, top-down image, cropping out everything outside the document.
- Manual adjustment screen: draggable corner handles with a magnifier loupe, plus rotate 90° and reset.
- Fallback: if no document is detected, use the full frame and let the user adjust corners manually.
- Support importing images from the gallery and running the same detection/crop on them.
- Multi-page scanning: capture several pages in one session, then reorder (drag and drop) or delete pages.

## 4. Scan Quality (text and images must be sharp and clear)
- Capture at the highest available resolution (CameraX ImageCapture, CAPTURE_MODE_MAXIMIZE_QUALITY), with tap-to-focus, auto-focus before capture, flash/torch toggle.
- Blur detection (e.g. Laplacian variance): if the shot is blurry, warn the user and suggest retaking.
- Enhancement filters, applied after cropping:
  - Auto (default): shadow removal, auto contrast, white balance, sharpening (unsharp mask).
  - Document / B&W: adaptive thresholding for crisp text.
  - Grayscale.
  - Color / Photo: preserve colors and images, mild enhancement only.
  - Original.
- Brightness and contrast sliders.
- Process images without visible quality loss; export PDF at a high DPI setting (user-selectable: standard / high).

## 5. Editing
- Page-level: crop, rotate, re-adjust corners, change filter, reorder, delete, add pages.
- Annotation: freehand pen, highlighter, eraser, text boxes (font size, color), shapes (rectangle, arrow, line), with undo/redo.
- OCR: extract text from a page, let the user copy, edit, and share it. Optionally save a searchable PDF (invisible text layer over the image).
- Rename documents, organize into folders.

## 6. Signature
- Signature pad: smooth, pressure-like stroke rendering (Bezier smoothing), choice of colors (black, blue) and stroke width, clear/undo.
- Also allow creating a signature from a photo (remove background to transparent) or typed name in a handwriting-style font.
- Save multiple signatures/initials for reuse (stored locally, securely).
- Place a signature on any page: drag, resize, rotate, delete. Add an optional date stamp next to it.
- "Flatten" the signature into the final exported PDF.

## 7. Export & Sharing
- Export as PDF (multi-page) or JPG/PNG (per page).
- Share via Android share sheet, save to device (Storage Access Framework), print.
- Option to compress PDF (quality vs. file size).

## 8. Privacy, Security & Performance
- Everything works fully offline; no data leaves the device.
- Optional biometric lock for the app.
- Request permissions properly (camera, with clear rationale); use the photo picker for gallery import.
- Keep image processing off the main thread; avoid memory leaks with large bitmaps (downsample for previews, full resolution only for export).

## 9. Code Quality
- Modular, readable code with clear package structure (ui / domain / data / imageprocessing).
- Unit tests for the image-processing and corner-detection logic, and for ViewModels.
- Handle errors gracefully with user-friendly messages.
- Include a README with setup instructions and an overview of the architecture.

## Suggested Milestones
1. Project setup, theme, navigation, home screen with empty state.
2. Camera screen with live edge detection overlay and capture.
3. Perspective crop + manual corner adjustment + enhancement filters.
4. Multi-page sessions, storage (Room), document list and viewer.
5. Editing tools (annotations, undo/redo, OCR).
6. Signature creation, saving, and placement.
7. PDF export, sharing, settings, biometric lock.
8. Polish: animations, RTL/Hebrew, accessibility, tests, README.

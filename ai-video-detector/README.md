# AI Video Detector (Android)

Background app that flags likely AI-generated videos while you scroll TikTok,
Instagram Reels, YouTube Shorts, Facebook and Snapchat. All analysis runs on the
phone; no frames leave the device.

- **Min Android:** 8.0 (API 26, 2017), **target:** API 36
- **Distribution:** Google Play (no AccessibilityService, which Play restricts)
- **Status:** prototype scaffold. The pipeline is complete, but **no detection model
  is bundled yet**, so the badge shows "No detection model installed" until you add one.

## How it works

```
MainActivity ── user grants: usage access, overlay, screen-capture consent
      │
DetectorService (foreground service, type=mediaProjection)
  ├─ PowerGuard: screen off / power-save / battery < 20% / thermal → pause
  ├─ ForegroundAppMonitor (UsageStatsManager): target app in front?
  │     no  → capture surface detached (system renders nothing), poll every 1.5 s
  │     yes → capture at 384 px wide, sample every 0.7 s
  ├─ FrameHash (dHash): big change = user scrolled to a new video
  ├─ wait 0.7 s for the scroll to settle, check ScoreCache (seen before?)
  ├─ AiVideoClassifier (LiteRT): 4 frames × ~20 ms → average probability
  └─ OverlayBadge: "Likely AI · 87%" / "Possibly AI" / "No AI signs"
```

Why it's light on the battery:
- Nothing runs unless a target app is in the foreground and the screen is on.
- Frames are captured small, a few per second, never at 60 fps.
- The model runs about 4 times per video, not continuously, and results are cached.
- There's no network access and no extra libraries beyond LiteRT.

## Permissions and Play Store notes

| Permission | Why | Play Store |
|---|---|---|
| Screen capture (MediaProjection) | Only way to see another app's video | Allowed; consent dialog is shown **each time detection starts**, a status-bar indicator stays visible (OS rule, cannot be avoided) |
| `FOREGROUND_SERVICE_MEDIA_PROJECTION` | Required for capture on Android 14+ | Declare the foreground-service type in Play Console |
| `PACKAGE_USAGE_STATS` | Know when TikTok/Instagram is open, stay idle otherwise | User grants in Settings; explain it in the listing |
| `SYSTEM_ALERT_WINDOW` | Draw the result badge | User grants in Settings |

Also:
- On Android 14+ the consent dialog lets the user share **a single app**. Recommend
  choosing TikTok or Instagram: it's more private, and detection still works.
- After a reboot or when the user stops sharing, they must press **Start** again. Android
  doesn't allow a persistent capture grant.
- You'll need a clear privacy policy stating that the screen is processed on-device only.
- Apps can block capture with `FLAG_SECURE` (the frames come out black). Major social apps
  don't do this for their feeds today, but they could.

## Adding the detection model

Put the model at `app/src/main/assets/ai_video_detector.tflite`. Contract:

- Input: float32 `[1, H, W, 3]`, RGB, values `0..1` (e.g. 224×224)
- Output: `[1, 1]` sigmoid P(AI), or `[1, 2]` softmax `[real, ai]`
- Weights INT8-quantized (float I/O) for a model of about 3–10 MB

The classifier sees the video region only (top 12%, bottom 20% and right 15% of the
screen are cropped away to skip app UI and the badge); see
`AiVideoClassifier.videoRegion`.

Training outline:
1. Collect real short-form clips and AI clips from current generators (Sora, Veo,
   Kling, Runway, Hailuo, etc.).
2. **Train on what the app will actually see**: play clips on a phone and record frames
   through this same capture path, or simulate it (re-encode at social-media bitrates,
   downscale to 384 px wide, crop like `videoRegion`).
3. Fine-tune a small backbone (MobileNetV3 / EfficientNet-Lite0) in PyTorch or Keras.
4. Export to `.tflite` with INT8 post-training quantization.
5. Retrain regularly, since new generators reduce accuracy.

## Tuning knobs (`DetectorService` companion)

| Constant | Default | Effect |
|---|---|---|
| `CAPTURE_WIDTH` | 384 | Capture resolution |
| `WATCH_INTERVAL_MS` | 700 | Sampling rate while a video is playing |
| `NEW_VIDEO_DISTANCE` | 20 | dHash bits that mean "new video". Lower = more sensitive |
| `SETTLE_MS` | 700 | Delay after a scroll before analyzing |
| `FRAMES_PER_VIDEO` | 4 | Frames averaged per video |

## Build

Open the `ai-video-detector` folder in Android Studio (with JDK 17+), or run:

```
./gradlew assembleDebug
```

## Known limitations

- Hard scene cuts inside a video look like a scroll, so the video gets re-analyzed
  (small extra cost, no wrong result).
- Detection accuracy depends entirely on the model; show results as probabilities.
- The model only sees single frames. A temporal model (frame sequences) would catch
  flicker and morphing better, at higher cost.

package com.aivideodetector

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.PixelFormat
import android.graphics.Rect
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.SystemClock
import android.util.DisplayMetrics
import android.view.WindowManager

/**
 * Foreground service that owns the screen capture and runs the detection loop.
 *
 * Power strategy:
 *  - Capture surface is detached (no frames rendered) unless a target app is in front.
 *  - Frames are captured at low resolution ([CAPTURE_WIDTH] px wide) and sampled a few
 *    times per second, never at the display frame rate.
 *  - The model runs only on [FRAMES_PER_VIDEO] frames after the feed settles on a new
 *    video, and results are cached by frame hash so re-watched videos cost nothing.
 *  - Everything pauses on low battery, power-save mode, screen off or thermal pressure.
 */
class DetectorService : Service() {

    private lateinit var workerThread: HandlerThread
    private lateinit var worker: Handler

    private lateinit var appMonitor: ForegroundAppMonitor
    private lateinit var powerGuard: PowerGuard
    private lateinit var badge: OverlayBadge
    private var classifier: AiVideoClassifier? = null

    private var projection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var surfaceAttached = false

    @Volatile private var stopped = false
    private var rawFrame: Bitmap? = null // includes the buffer's row padding, if any
    private var lastFrame: Bitmap? = null
    private var prevHash: Long? = null
    private var videoHash = 0L
    private var lastJumpAt = 0L
    private var pendingAnalysis = false
    private val scores = ArrayList<Float>(FRAMES_PER_VIDEO)
    private val cache = ScoreCache(capacity = 300)

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        workerThread = HandlerThread("detector").apply { start() }
        worker = Handler(workerThread.looper)
        appMonitor = ForegroundAppMonitor(this)
        powerGuard = PowerGuard(this)
        badge = OverlayBadge(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }
        startInForeground()

        val resultCode = intent?.getIntExtra(EXTRA_RESULT_CODE, 0) ?: 0
        val data: Intent? = if (Build.VERSION.SDK_INT >= 33) {
            intent?.getParcelableExtra(EXTRA_DATA, Intent::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent?.getParcelableExtra(EXTRA_DATA)
        }
        if (projection == null && data != null) {
            worker.post { startCapture(resultCode, data) }
        }
        // The capture consent cannot be reused, so never ask the system to restart us.
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        stopped = true
        worker.removeCallbacksAndMessages(null)
        worker.post {
            virtualDisplay?.release()
            imageReader?.close()
            projection?.stop()
            classifier?.close()
            rawFrame?.recycle()
            if (lastFrame !== rawFrame) lastFrame?.recycle()
            // Posted from the worker so it lands after any badge update the loop made.
            badge.hide()
        }
        workerThread.quitSafely()
        super.onDestroy()
    }

    // ---- Capture ---------------------------------------------------------------------

    private fun startCapture(resultCode: Int, data: Intent) {
        val mpm = getSystemService(MediaProjectionManager::class.java)
        val mp = mpm.getMediaProjection(resultCode, data) ?: run { stopSelf(); return }
        projection = mp
        // Required before createVirtualDisplay on Android 14+.
        mp.registerCallback(object : MediaProjection.Callback() {
            override fun onStop() {
                stopSelf()
            }
        }, worker)

        val metrics = realMetrics()
        val scale = CAPTURE_WIDTH.toFloat() / metrics.widthPixels
        val width = CAPTURE_WIDTH
        val height = (metrics.heightPixels * scale).toInt()
        val dpi = (metrics.densityDpi * scale).toInt().coerceAtLeast(1)

        val reader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
        imageReader = reader
        virtualDisplay = mp.createVirtualDisplay(
            "ai-video-detector", width, height, dpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            reader.surface, null, worker
        )
        surfaceAttached = true

        classifier = AiVideoClassifier(this)
        worker.post(tick)
    }

    private fun setCapturing(on: Boolean) {
        if (on == surfaceAttached) return
        // Detaching the surface stops the system from rendering into it: zero GPU cost.
        virtualDisplay?.surface = if (on) imageReader?.surface else null
        surfaceAttached = on
    }

    /** Latest captured frame, or the previous one if the screen has not changed. */
    private fun grabFrame(): Bitmap? {
        val image = imageReader?.acquireLatestImage() ?: return lastFrame
        image.use {
            val width = it.width
            val height = it.height
            val plane = it.planes[0]
            val rowPixels = plane.rowStride / plane.pixelStride

            var raw = rawFrame
            if (raw == null || raw.width != rowPixels || raw.height != height) {
                raw?.recycle()
                if (lastFrame !== rawFrame) lastFrame?.recycle()
                raw = Bitmap.createBitmap(rowPixels, height, Bitmap.Config.ARGB_8888)
                rawFrame = raw
                lastFrame = if (rowPixels == width) raw
                else Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            }
            try {
                raw.copyPixelsFromBuffer(plane.buffer)
            } catch (e: RuntimeException) {
                // Some devices omit the last row's padding, making the buffer too short.
                return lastFrame
            }

            val frame = lastFrame!!
            if (frame !== raw) {
                // Drop the padding columns at the end of each row.
                val area = Rect(0, 0, width, height)
                Canvas(frame).drawBitmap(raw, area, area, null)
            }
        }
        return lastFrame
    }

    // ---- Detection loop --------------------------------------------------------------

    private val tick = object : Runnable {
        override fun run() {
            worker.postDelayed(this, step())
        }
    }

    /** One iteration of the loop; returns the delay until the next one. */
    private fun step(): Long {
        if (stopped) return PAUSED_POLL_MS
        if (!powerGuard.canRun()) {
            pause()
            return PAUSED_POLL_MS
        }
        if (!appMonitor.isTargetAppInForeground()) {
            pause()
            return IDLE_POLL_MS
        }
        setCapturing(true)

        val frame = grabFrame() ?: return WATCH_INTERVAL_MS
        val now = SystemClock.elapsedRealtime()
        val hash = FrameHash.dHash(frame)
        val prev = prevHash
        prevHash = hash

        if (prev == null || FrameHash.distance(prev, hash) >= NEW_VIDEO_DISTANCE) {
            // Big visual jump: user scrolled to another video (or a hard scene cut).
            lastJumpAt = now
            pendingAnalysis = true
            scores.clear()
            badge.hide()
            return COLLECT_INTERVAL_MS
        }

        if (!pendingAnalysis) return WATCH_INTERVAL_MS
        if (now - lastJumpAt < SETTLE_MS) return COLLECT_INTERVAL_MS

        if (scores.isEmpty()) {
            videoHash = hash
            cache.find(hash)?.let {
                pendingAnalysis = false
                showResult(it)
                return WATCH_INTERVAL_MS
            }
        }

        val model = classifier
        if (model == null || !model.isAvailable) {
            pendingAnalysis = false
            badge.show(getString(R.string.no_model), COLOR_NEUTRAL)
            return WATCH_INTERVAL_MS
        }

        model.score(frame)?.let { scores += it }
        if (scores.size < FRAMES_PER_VIDEO) return COLLECT_INTERVAL_MS

        val score = scores.average().toFloat()
        cache.put(videoHash, score)
        pendingAnalysis = false
        showResult(score)
        return WATCH_INTERVAL_MS
    }

    private fun pause() {
        setCapturing(false)
        badge.hide()
        prevHash = null
        pendingAnalysis = false
    }

    private fun showResult(aiProbability: Float) {
        val pct = (aiProbability * 100).toInt()
        when {
            aiProbability >= 0.8f -> badge.show("Likely AI · $pct%", COLOR_AI)
            aiProbability >= 0.5f -> badge.show("Possibly AI · $pct%", COLOR_MAYBE)
            else -> badge.show("No AI signs · $pct%", COLOR_REAL)
        }
    }

    // ---- Setup helpers ---------------------------------------------------------------

    private fun realMetrics(): DisplayMetrics {
        val wm = getSystemService(WindowManager::class.java)
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        wm.defaultDisplay.getRealMetrics(metrics)
        return metrics
    }

    private fun startInForeground() {
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ID, getString(R.string.notif_channel), NotificationManager.IMPORTANCE_LOW
            )
        )
        val stopIntent = PendingIntent.getService(
            this, 0,
            Intent(this, DetectorService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_IMMUTABLE
        )
        val notification = Notification.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(getString(R.string.notif_title))
            .setContentText(getString(R.string.notif_text))
            .setOngoing(true)
            .addAction(
                Notification.Action.Builder(null, getString(R.string.stop), stopIntent).build()
            )
            .build()

        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(
                NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    companion object {
        private const val EXTRA_RESULT_CODE = "result_code"
        private const val EXTRA_DATA = "data"
        private const val ACTION_STOP = "com.aivideodetector.STOP"
        private const val CHANNEL_ID = "detector"
        private const val NOTIFICATION_ID = 1

        /** Capture width in pixels; the system downsamples for us, which is cheap. */
        private const val CAPTURE_WIDTH = 384 // multiple of 64 px: usually no row padding

        private const val WATCH_INTERVAL_MS = 700L // looking for the next scroll
        private const val COLLECT_INTERVAL_MS = 300L // gathering frames of a new video
        private const val IDLE_POLL_MS = 1500L // no target app in front
        private const val PAUSED_POLL_MS = 10_000L // battery/thermal/screen-off pause
        private const val SETTLE_MS = 700L // wait for the scroll animation to finish
        private const val NEW_VIDEO_DISTANCE = 20 // dHash bits (of 64) that mean "new video"
        private const val FRAMES_PER_VIDEO = 4

        private const val COLOR_AI = 0xE6D32F2F.toInt()
        private const val COLOR_MAYBE = 0xE6F57C00.toInt()
        private const val COLOR_REAL = 0xE6388E3C.toInt()
        private const val COLOR_NEUTRAL = 0xE6616161.toInt()

        fun start(context: Context, resultCode: Int, data: Intent) {
            context.startForegroundService(
                Intent(context, DetectorService::class.java)
                    .putExtra(EXTRA_RESULT_CODE, resultCode)
                    .putExtra(EXTRA_DATA, data)
            )
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, DetectorService::class.java))
        }
    }
}

package com.aivideodetector

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build

/**
 * Tracks the foreground app through UsageStatsManager. Each poll only reads the events
 * since the previous poll, so it is cheap enough to run every second or two.
 */
class ForegroundAppMonitor(context: Context) {

    private val usm = context.getSystemService(UsageStatsManager::class.java)
    private val event = UsageEvents.Event()
    private var lastQueryTime = System.currentTimeMillis() - INITIAL_LOOKBACK_MS
    private var current: String? = null

    fun currentPackage(): String? {
        val now = System.currentTimeMillis()
        val events = usm.queryEvents(lastQueryTime, now)
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == RESUMED) current = event.packageName
        }
        lastQueryTime = now
        return current
    }

    fun isTargetAppInForeground(): Boolean = currentPackage() in TARGET_PACKAGES

    companion object {
        private const val INITIAL_LOOKBACK_MS = 30 * 60 * 1000L

        private val RESUMED = if (Build.VERSION.SDK_INT >= 29) {
            UsageEvents.Event.ACTIVITY_RESUMED
        } else {
            @Suppress("DEPRECATION")
            UsageEvents.Event.MOVE_TO_FOREGROUND
        }

        /** Short-video feeds we analyze. Everything else is ignored at zero cost. */
        val TARGET_PACKAGES = setOf(
            "com.zhiliaoapp.musically", // TikTok
            "com.ss.android.ugc.trill", // TikTok (some regions)
            "com.instagram.android",
            "com.google.android.youtube", // Shorts
            "com.facebook.katana",
            "com.snapchat.android",
        )
    }
}

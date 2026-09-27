package com.aivideodetector

import android.content.Context
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager

/** Decides whether the device can afford analysis right now. */
class PowerGuard(context: Context) {

    private val power = context.getSystemService(PowerManager::class.java)
    private val battery = context.getSystemService(BatteryManager::class.java)

    fun canRun(): Boolean {
        if (!power.isInteractive || power.isPowerSaveMode) return false
        val level = battery.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        if (level in 0 until MIN_BATTERY_PERCENT && !battery.isCharging) return false
        if (Build.VERSION.SDK_INT >= 29 &&
            power.currentThermalStatus >= PowerManager.THERMAL_STATUS_MODERATE
        ) return false
        return true
    }

    private companion object {
        const val MIN_BATTERY_PERCENT = 20
    }
}

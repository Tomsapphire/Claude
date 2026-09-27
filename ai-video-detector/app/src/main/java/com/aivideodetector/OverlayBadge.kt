package com.aivideodetector

import android.content.Context
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager
import android.widget.TextView

/** Small, non-touchable label drawn over the social app. Thread-safe. */
class OverlayBadge(private val context: Context) {

    private val main = Handler(Looper.getMainLooper())
    private val wm = context.getSystemService(WindowManager::class.java)
    private var view: TextView? = null

    fun show(text: String, color: Int) = main.post {
        if (!Settings.canDrawOverlays(context)) return@post
        val v = view ?: createView().also { view = it }
        v.text = text
        (v.background as GradientDrawable).setColor(color)
    }

    fun hide() = main.post {
        view?.let { wm.removeView(it) }
        view = null
    }

    private fun createView(): TextView {
        val density = context.resources.displayMetrics.density
        val v = TextView(context).apply {
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 13f
            val pad = (8 * density).toInt()
            setPadding(pad * 2, pad, pad * 2, pad)
            background = GradientDrawable().apply { cornerRadius = 16 * density }
        }
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            // Keep inside the top band that the classifier ignores.
            y = (40 * density).toInt()
        }
        wm.addView(v, params)
        return v
    }
}

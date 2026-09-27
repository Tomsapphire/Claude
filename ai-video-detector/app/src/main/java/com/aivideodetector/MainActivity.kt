package com.aivideodetector

import android.Manifest
import android.app.Activity
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Process
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import android.widget.Toast

/** One-screen setup: grant permissions, then start/stop the background detector. */
class MainActivity : Activity() {

    private lateinit var btnUsage: Button
    private lateinit var btnOverlay: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        btnUsage = findViewById(R.id.btn_usage)
        btnOverlay = findViewById(R.id.btn_overlay)

        btnUsage.setOnClickListener {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
        }
        btnOverlay.setOnClickListener {
            startActivity(
                Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
            )
        }
        findViewById<Button>(R.id.btn_start).setOnClickListener { requestStart() }
        findViewById<Button>(R.id.btn_stop).setOnClickListener { DetectorService.stop(this) }

        if (!AiVideoClassifier.isModelBundled(this)) {
            findViewById<TextView>(R.id.txt_model).setText(R.string.no_model)
        }
    }

    override fun onResume() {
        super.onResume()
        updatePermissionButton(btnUsage, hasUsageAccess(this))
        updatePermissionButton(btnOverlay, Settings.canDrawOverlays(this))
    }

    private fun updatePermissionButton(button: Button, granted: Boolean) {
        button.setText(if (granted) R.string.granted else R.string.grant)
        button.isEnabled = !granted
    }

    private fun requestStart() {
        if (!hasUsageAccess(this) || !Settings.canDrawOverlays(this)) {
            Toast.makeText(this, R.string.missing_permissions, Toast.LENGTH_SHORT).show()
            return
        }
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), REQ_NOTIFICATIONS)
            return
        }
        // Screen-capture consent. On Android 14+ the user may pick "a single app" here,
        // e.g. only TikTok, which is the most private option.
        val mpm = getSystemService(MediaProjectionManager::class.java)
        @Suppress("DEPRECATION")
        startActivityForResult(mpm.createScreenCaptureIntent(), REQ_CAPTURE)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<out String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        // Continue even if denied: the service still works, the notification is just hidden.
        if (requestCode == REQ_NOTIFICATIONS) requestStart()
    }

    @Deprecated("Activity result API is not used to keep dependencies minimal")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        @Suppress("DEPRECATION")
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_CAPTURE && resultCode == RESULT_OK && data != null) {
            DetectorService.start(this, resultCode, data)
            moveTaskToBack(true)
        }
    }

    companion object {
        private const val REQ_CAPTURE = 1
        private const val REQ_NOTIFICATIONS = 2

        fun hasUsageAccess(context: Context): Boolean {
            val appOps = context.getSystemService(AppOpsManager::class.java)
            val mode = if (Build.VERSION.SDK_INT >= 29) {
                appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName
                )
            } else {
                @Suppress("DEPRECATION")
                appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName
                )
            }
            return mode == AppOpsManager.MODE_ALLOWED
        }
    }
}

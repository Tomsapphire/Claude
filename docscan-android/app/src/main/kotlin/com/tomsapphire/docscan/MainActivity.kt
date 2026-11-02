package com.tomsapphire.docscan

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.tomsapphire.docscan.navigation.DocScanNavHost
import com.tomsapphire.docscan.ui.theme.DocScanTheme
import dagger.hilt.android.AndroidEntryPoint

/** The single activity. Every screen is a Compose destination in [DocScanNavHost]. */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            DocScanTheme {
                DocScanNavHost()
            }
        }
    }
}

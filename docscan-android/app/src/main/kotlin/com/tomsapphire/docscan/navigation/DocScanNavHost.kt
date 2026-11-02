package com.tomsapphire.docscan.navigation

import androidx.compose.animation.AnimatedContentTransitionScope.SlideDirection
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.runtime.Composable
import androidx.navigation.NavBackStackEntry
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.compose.animation.AnimatedContentTransitionScope
import com.tomsapphire.docscan.ui.home.HomeRoute
import com.tomsapphire.docscan.ui.scanner.ScannerScreen
import com.tomsapphire.docscan.ui.theme.DocScanMotion
import kotlinx.serialization.Serializable

@Serializable
data object HomeDestination

@Serializable
data object ScannerDestination

@Composable
fun DocScanNavHost(navController: NavHostController = rememberNavController()) {
    NavHost(
        navController = navController,
        startDestination = HomeDestination,
        // Material "shared axis X": forward slides towards the reading direction's start,
        // back reverses. Back transitions also drive the predictive back preview.
        enterTransition = { sharedAxisEnter(SlideDirection.Start) },
        exitTransition = { sharedAxisExit(SlideDirection.Start) },
        popEnterTransition = { sharedAxisEnter(SlideDirection.End) },
        popExitTransition = { sharedAxisExit(SlideDirection.End) },
    ) {
        composable<HomeDestination> {
            HomeRoute(
                onScanClick = { navController.navigate(ScannerDestination) { launchSingleTop = true } },
                onDocumentClick = { /* Document viewer arrives with storage in milestone 4. */ },
            )
        }
        composable<ScannerDestination> {
            ScannerScreen(onNavigateUp = navController::navigateUp)
        }
    }
}

private const val SHARED_AXIS_OFFSET_DIVISOR = 10

private fun AnimatedContentTransitionScope<NavBackStackEntry>.sharedAxisEnter(
    towards: SlideDirection,
): EnterTransition =
    slideIntoContainer(towards, DocScanMotion.spatial(), initialOffset = { it / SHARED_AXIS_OFFSET_DIVISOR }) +
        fadeIn(DocScanMotion.effects())

private fun AnimatedContentTransitionScope<NavBackStackEntry>.sharedAxisExit(
    towards: SlideDirection,
): ExitTransition =
    slideOutOfContainer(towards, DocScanMotion.spatial(), targetOffset = { it / SHARED_AXIS_OFFSET_DIVISOR }) +
        fadeOut(DocScanMotion.effects())

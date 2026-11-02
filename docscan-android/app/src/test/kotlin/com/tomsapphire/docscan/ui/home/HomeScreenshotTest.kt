package com.tomsapphire.docscan.ui.home

import android.app.Application
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import com.github.takahirom.roborazzi.RobolectricDeviceQualifiers
import com.github.takahirom.roborazzi.captureRoboImage
import com.tomsapphire.docscan.domain.model.DocumentLayout
import com.tomsapphire.docscan.ui.home.components.SortOptions
import com.tomsapphire.docscan.ui.theme.DocScanTheme
import com.tomsapphire.docscan.domain.model.DocumentSort
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * Renders the home screen on the JVM. Run `./gradlew recordRoborazziDebug` to write the
 * images to app/build/outputs/roborazzi; a plain test run only checks that they render.
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [36], application = Application::class, qualifiers = RobolectricDeviceQualifiers.Pixel7)
class HomeScreenshotTest {

    @get:Rule
    val composeRule = createComposeRule()

    private fun capture(name: String, darkTheme: Boolean = false, content: @Composable () -> Unit) {
        composeRule.setContent {
            DocScanTheme(darkTheme = darkTheme, dynamicColor = false) {
                content()
            }
        }
        composeRule.onRoot().captureRoboImage("build/outputs/roborazzi/$name.png")
    }

    @Composable
    private fun Home(state: HomeUiState, query: String = "") = HomeScreen(
        state = state,
        query = query,
        onQueryChange = {},
        onSortChange = {},
        onToggleLayout = {},
        onScanClick = {},
        onDocumentClick = {},
    )

    @Test
    fun emptyLight() = capture("home_empty_light") { Home(HomeUiState(isLoading = false)) }

    @Test
    @Config(qualifiers = "+night")
    fun emptyDark() = capture("home_empty_dark", darkTheme = true) { Home(HomeUiState(isLoading = false)) }

    @Test
    fun gridLight() = capture("home_grid_light") { Home(HomeSampleData.state(HomeSampleData.english)) }

    @Test
    @Config(qualifiers = "+night")
    fun listDark() = capture("home_list_dark", darkTheme = true) {
        Home(HomeSampleData.state(HomeSampleData.english, DocumentLayout.LIST))
    }

    @Test
    @Config(qualifiers = "+iw-rIL")
    fun gridHebrew() = capture("home_grid_hebrew") { Home(HomeSampleData.state(HomeSampleData.hebrew)) }

    @Test
    @Config(qualifiers = "+iw-rIL")
    fun emptyHebrew() = capture("home_empty_hebrew") { Home(HomeUiState(isLoading = false)) }

    @Test
    fun noResults() = capture("home_no_results") {
        Home(HomeUiState(isLoading = false, totalCount = 6, searchedQuery = "invoice"), query = "invoice")
    }

    @Test
    @Config(qualifiers = RobolectricDeviceQualifiers.MediumTablet)
    fun gridTablet() = capture("home_grid_tablet") { Home(HomeSampleData.state(HomeSampleData.english)) }

    @Test
    fun sortOptions() = capture("home_sort_options") {
        Surface { SortOptions(selected = DocumentSort.TITLE_A_TO_Z, onSelect = {}) }
    }
}

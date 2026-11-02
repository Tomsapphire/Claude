package com.tomsapphire.docscan.ui.home

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.tooling.preview.PreviewLightDark
import androidx.compose.ui.tooling.preview.PreviewScreenSizes
import com.tomsapphire.docscan.domain.model.Document
import com.tomsapphire.docscan.domain.model.DocumentLayout
import com.tomsapphire.docscan.ui.theme.DocScanTheme
import java.time.Duration
import java.time.Instant

/** Sample content for Android Studio previews and screenshot tests. */
internal object HomeSampleData {
    private val now: Instant = Instant.parse("2026-11-02T09:00:00Z")

    private fun doc(id: Long, title: String, pages: Int, daysAgo: Long) = Document(
        id = id,
        title = title,
        createdAt = now.minus(Duration.ofDays(daysAgo + 2)),
        updatedAt = now.minus(Duration.ofDays(daysAgo)),
        pageCount = pages,
        thumbnailPath = null,
        folderId = null,
    )

    val english = listOf(
        doc(1, "Apartment lease agreement", pages = 6, daysAgo = 0),
        doc(2, "Electricity bill — October", pages = 1, daysAgo = 1),
        doc(3, "Passport copy", pages = 2, daysAgo = 3),
        doc(4, "Tax return 2025", pages = 12, daysAgo = 9),
        doc(5, "Warranty — dishwasher", pages = 1, daysAgo = 20),
        doc(6, "Meeting notes", pages = 3, daysAgo = 41),
    )

    val hebrew = listOf(
        doc(11, "חוזה שכירות לדירה", pages = 6, daysAgo = 0),
        doc(12, "חשבון חשמל — אוקטובר", pages = 1, daysAgo = 1),
        doc(13, "צילום דרכון", pages = 2, daysAgo = 3),
        doc(14, "דוח שנתי למס הכנסה", pages = 12, daysAgo = 9),
        doc(15, "תעודת אחריות למדיח", pages = 1, daysAgo = 20),
        doc(16, "סיכום פגישה", pages = 3, daysAgo = 41),
    )

    fun state(documents: List<Document>, layout: DocumentLayout = DocumentLayout.GRID) = HomeUiState(
        isLoading = false,
        documents = documents,
        totalCount = documents.size,
        layout = layout,
    )
}

@Composable
private fun HomePreview(state: HomeUiState, query: String = "") {
    DocScanTheme(dynamicColor = false) {
        HomeScreen(
            state = state,
            query = query,
            onQueryChange = {},
            onSortChange = {},
            onToggleLayout = {},
            onScanClick = {},
            onDocumentClick = {},
        )
    }
}

@PreviewLightDark
@Composable
private fun HomeEmptyPreview() = HomePreview(HomeUiState(isLoading = false))

@PreviewScreenSizes
@Composable
private fun HomeGridPreview() = HomePreview(HomeSampleData.state(HomeSampleData.english))

@PreviewLightDark
@Composable
private fun HomeListPreview() = HomePreview(HomeSampleData.state(HomeSampleData.english, DocumentLayout.LIST))

@Preview(locale = "iw")
@Composable
private fun HomeHebrewPreview() = HomePreview(HomeSampleData.state(HomeSampleData.hebrew))

@Preview
@Composable
private fun HomeNoResultsPreview() = HomePreview(
    HomeUiState(isLoading = false, totalCount = 6, searchedQuery = "invoice"),
    query = "invoice",
)

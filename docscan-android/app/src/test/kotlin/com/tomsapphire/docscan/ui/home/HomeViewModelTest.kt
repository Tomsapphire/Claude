package com.tomsapphire.docscan.ui.home

import app.cash.turbine.ReceiveTurbine
import app.cash.turbine.test
import com.tomsapphire.docscan.domain.model.DocumentLayout
import com.tomsapphire.docscan.domain.model.DocumentSort
import com.tomsapphire.docscan.domain.usecase.ObserveDocumentsUseCase
import com.tomsapphire.docscan.testing.FakeDocumentRepository
import com.tomsapphire.docscan.testing.FakeUserPreferencesRepository
import com.tomsapphire.docscan.testing.MainDispatcherRule
import com.tomsapphire.docscan.testing.testDocument
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlinx.coroutines.test.runTest
import org.junit.Rule

class HomeViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val repository = FakeDocumentRepository()
    private val preferences = FakeUserPreferencesRepository()

    private fun viewModel() = HomeViewModel(ObserveDocumentsUseCase(repository), preferences)

    /** StateFlow conflates, so the loading placeholder may or may not be observed; skip it. */
    private suspend fun ReceiveTurbine<HomeUiState>.awaitLoaded(): HomeUiState {
        var state = awaitItem()
        while (state.isLoading) state = awaitItem()
        return state
    }

    @Test
    fun `starts loading, then reports an empty library`() = runTest {
        val viewModel = viewModel()
        assertEquals(HomeContent.Loading, viewModel.uiState.value.content)
        viewModel.uiState.test {
            assertEquals(HomeContent.EmptyLibrary, awaitLoaded().content)
        }
    }

    @Test
    fun `query filters documents and distinguishes no results from empty library`() = runTest {
        repository.documents.value = listOf(
            testDocument(1, "Lease agreement"),
            testDocument(2, "Electricity bill"),
        )
        val viewModel = viewModel()
        viewModel.uiState.test {
            assertEquals(2, awaitLoaded().documents.size)

            viewModel.onQueryChange("lease")
            assertEquals("lease", viewModel.query)
            val filtered = awaitItem()
            assertEquals(listOf(1L), filtered.documents.map { it.id })
            assertEquals(HomeContent.Documents, filtered.content)

            viewModel.onQueryChange("passport")
            val none = awaitItem()
            assertEquals(HomeContent.NoResults, none.content)
            assertEquals("passport", none.searchedQuery)
        }
    }

    @Test
    fun `sort choice is persisted and applied`() = runTest {
        repository.documents.value = listOf(
            testDocument(1, "Beta", created = 10),
            testDocument(2, "Alpha", created = 20),
        )
        val viewModel = viewModel()
        viewModel.uiState.test {
            assertEquals(listOf(2L, 1L), awaitLoaded().documents.map { it.id })

            viewModel.onSortChange(DocumentSort.CREATED_OLDEST)
            val sorted = awaitItem()
            assertEquals(DocumentSort.CREATED_OLDEST, sorted.sort)
            assertEquals(listOf(1L, 2L), sorted.documents.map { it.id })
            assertEquals(DocumentSort.CREATED_OLDEST, preferences.documentSort.value)
        }
    }

    @Test
    fun `layout toggles between grid and list`() = runTest {
        val viewModel = viewModel()
        viewModel.uiState.test {
            assertEquals(DocumentLayout.GRID, awaitLoaded().layout)

            viewModel.onToggleLayout()
            assertEquals(DocumentLayout.LIST, awaitItem().layout)

            viewModel.onToggleLayout()
            assertEquals(DocumentLayout.GRID, awaitItem().layout)
        }
    }
}

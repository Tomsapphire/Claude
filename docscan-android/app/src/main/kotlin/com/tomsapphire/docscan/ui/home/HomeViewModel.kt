package com.tomsapphire.docscan.ui.home

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tomsapphire.docscan.domain.model.DocumentLayout
import com.tomsapphire.docscan.domain.model.DocumentSort
import com.tomsapphire.docscan.domain.repository.UserPreferencesRepository
import com.tomsapphire.docscan.domain.usecase.ObserveDocumentsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@HiltViewModel
class HomeViewModel @Inject constructor(
    observeDocuments: ObserveDocumentsUseCase,
    private val preferences: UserPreferencesRepository,
) : ViewModel() {

    /**
     * Backs the search field directly. Compose state is updated synchronously while the user
     * types, so the field never loses characters waiting for the asynchronous pipeline below.
     */
    var query by mutableStateOf("")
        private set

    private val queryFlow = MutableStateFlow("")

    val uiState: StateFlow<HomeUiState> = combine(
        observeDocuments(queryFlow, preferences.documentSort),
        preferences.documentLayout,
    ) { result, layout ->
        HomeUiState(
            isLoading = false,
            documents = result.documents,
            totalCount = result.totalCount,
            searchedQuery = result.query,
            sort = result.sort,
            layout = layout,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
        initialValue = HomeUiState(),
    )

    fun onQueryChange(value: String) {
        query = value
        queryFlow.value = value
    }

    fun onSortChange(sort: DocumentSort) {
        viewModelScope.launch { preferences.setDocumentSort(sort) }
    }

    fun onToggleLayout() {
        val next = when (uiState.value.layout) {
            DocumentLayout.GRID -> DocumentLayout.LIST
            DocumentLayout.LIST -> DocumentLayout.GRID
        }
        viewModelScope.launch { preferences.setDocumentLayout(next) }
    }

    private companion object {
        /** Keeps the pipeline alive across configuration changes without leaking it in the background. */
        const val STOP_TIMEOUT_MILLIS = 5_000L
    }
}

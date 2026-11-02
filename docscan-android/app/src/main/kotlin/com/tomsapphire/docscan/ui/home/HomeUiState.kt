package com.tomsapphire.docscan.ui.home

import androidx.compose.runtime.Immutable
import com.tomsapphire.docscan.domain.model.Document
import com.tomsapphire.docscan.domain.model.DocumentLayout
import com.tomsapphire.docscan.domain.model.DocumentSort

@Immutable
data class HomeUiState(
    val isLoading: Boolean = true,
    val documents: List<Document> = emptyList(),
    val totalCount: Int = 0,
    /** The query [documents] were filtered by (may trail the text field by a frame). */
    val searchedQuery: String = "",
    val sort: DocumentSort = DocumentSort.Default,
    val layout: DocumentLayout = DocumentLayout.Default,
) {
    val content: HomeContent
        get() = when {
            isLoading -> HomeContent.Loading
            totalCount == 0 -> HomeContent.EmptyLibrary
            documents.isEmpty() -> HomeContent.NoResults
            else -> HomeContent.Documents
        }
}

enum class HomeContent { Loading, EmptyLibrary, NoResults, Documents }

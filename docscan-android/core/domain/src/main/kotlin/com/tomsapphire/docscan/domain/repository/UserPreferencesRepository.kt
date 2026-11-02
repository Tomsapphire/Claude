package com.tomsapphire.docscan.domain.repository

import com.tomsapphire.docscan.domain.model.DocumentLayout
import com.tomsapphire.docscan.domain.model.DocumentSort
import kotlinx.coroutines.flow.Flow

interface UserPreferencesRepository {
    val documentSort: Flow<DocumentSort>
    val documentLayout: Flow<DocumentLayout>

    suspend fun setDocumentSort(sort: DocumentSort)
    suspend fun setDocumentLayout(layout: DocumentLayout)
}

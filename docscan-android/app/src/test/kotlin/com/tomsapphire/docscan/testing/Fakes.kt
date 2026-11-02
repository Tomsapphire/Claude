package com.tomsapphire.docscan.testing

import com.tomsapphire.docscan.domain.model.Document
import com.tomsapphire.docscan.domain.model.DocumentLayout
import com.tomsapphire.docscan.domain.model.DocumentSort
import com.tomsapphire.docscan.domain.repository.DocumentRepository
import com.tomsapphire.docscan.domain.repository.UserPreferencesRepository
import java.time.Instant
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow

class FakeDocumentRepository(initial: List<Document> = emptyList()) : DocumentRepository {
    val documents = MutableStateFlow(initial)
    override fun observeDocuments(): Flow<List<Document>> = documents
}

class FakeUserPreferencesRepository : UserPreferencesRepository {
    override val documentSort = MutableStateFlow(DocumentSort.Default)
    override val documentLayout = MutableStateFlow(DocumentLayout.Default)

    override suspend fun setDocumentSort(sort: DocumentSort) {
        documentSort.value = sort
    }

    override suspend fun setDocumentLayout(layout: DocumentLayout) {
        documentLayout.value = layout
    }
}

fun testDocument(id: Long, title: String, created: Long = id, updated: Long = created) = Document(
    id = id,
    title = title,
    createdAt = Instant.ofEpochSecond(created),
    updatedAt = Instant.ofEpochSecond(updated),
    pageCount = 1,
    thumbnailPath = null,
    folderId = null,
)

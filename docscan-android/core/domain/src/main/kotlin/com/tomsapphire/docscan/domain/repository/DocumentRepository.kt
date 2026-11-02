package com.tomsapphire.docscan.domain.repository

import com.tomsapphire.docscan.domain.model.Document
import kotlinx.coroutines.flow.Flow

interface DocumentRepository {
    /** Emits every document, unordered, whenever any of them changes. */
    fun observeDocuments(): Flow<List<Document>>
}

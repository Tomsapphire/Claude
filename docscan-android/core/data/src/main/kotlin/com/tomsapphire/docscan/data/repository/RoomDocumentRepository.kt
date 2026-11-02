package com.tomsapphire.docscan.data.repository

import com.tomsapphire.docscan.data.db.DocumentDao
import com.tomsapphire.docscan.data.db.toDomain
import com.tomsapphire.docscan.domain.model.Document
import com.tomsapphire.docscan.domain.repository.DocumentRepository
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

internal class RoomDocumentRepository @Inject constructor(
    private val dao: DocumentDao,
) : DocumentRepository {
    override fun observeDocuments(): Flow<List<Document>> =
        dao.observeAll().map { entities -> entities.map { it.toDomain() } }
}

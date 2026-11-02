package com.tomsapphire.docscan.domain.usecase

import app.cash.turbine.test
import com.tomsapphire.docscan.domain.model.Document
import com.tomsapphire.docscan.domain.model.DocumentSort
import com.tomsapphire.docscan.domain.repository.DocumentRepository
import java.time.Instant
import java.util.Locale
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runTest

class ObserveDocumentsUseCaseTest {

    private fun doc(id: Long, title: String, created: Long, updated: Long = created) = Document(
        id = id,
        title = title,
        createdAt = Instant.ofEpochSecond(created),
        updatedAt = Instant.ofEpochSecond(updated),
        pageCount = 1,
        thumbnailPath = null,
        folderId = null,
    )

    private val lease = doc(1, "Lease agreement", created = 100, updated = 500)
    private val invoice = doc(2, "invoice March", created = 200, updated = 300)
    private val hebrew = doc(3, "חוזה שכירות", created = 300, updated = 400)
    private val all = listOf(lease, invoice, hebrew)

    private fun ids(list: List<Document>) = list.map { it.id }

    @Test
    fun `blank query returns everything in requested order`() {
        val result = ObserveDocumentsUseCase.filterAndSort(all, "  ", DocumentSort.UPDATED_NEWEST, Locale.US)
        assertEquals(listOf(1L, 3L, 2L), ids(result))
    }

    @Test
    fun `every term must match, ignoring case`() {
        val result = ObserveDocumentsUseCase.filterAndSort(all, "INVOICE mar", DocumentSort.Default, Locale.US)
        assertEquals(listOf(2L), ids(result))
        val none = ObserveDocumentsUseCase.filterAndSort(all, "invoice april", DocumentSort.Default, Locale.US)
        assertEquals(emptyList(), ids(none))
    }

    @Test
    fun `hebrew query with niqqud matches plain title`() {
        val result = ObserveDocumentsUseCase.filterAndSort(all, "חוֹזֶה", DocumentSort.Default, Locale.US)
        assertEquals(listOf(3L), ids(result))
    }

    @Test
    fun `created sorts in both directions`() {
        assertEquals(listOf(3L, 2L, 1L), ids(ObserveDocumentsUseCase.filterAndSort(all, "", DocumentSort.CREATED_NEWEST, Locale.US)))
        assertEquals(listOf(1L, 2L, 3L), ids(ObserveDocumentsUseCase.filterAndSort(all, "", DocumentSort.CREATED_OLDEST, Locale.US)))
    }

    @Test
    fun `title sort is case insensitive and reversible`() {
        val latin = listOf(lease, invoice)
        assertEquals(listOf(2L, 1L), ids(ObserveDocumentsUseCase.filterAndSort(latin, "", DocumentSort.TITLE_A_TO_Z, Locale.US)))
        assertEquals(listOf(1L, 2L), ids(ObserveDocumentsUseCase.filterAndSort(latin, "", DocumentSort.TITLE_Z_TO_A, Locale.US)))
    }

    @Test
    fun `hebrew titles sort alphabetically`() {
        val alef = doc(10, "אישור", created = 1)
        val bet = doc(11, "בקשה", created = 2)
        val tav = doc(12, "תעודה", created = 3)
        val result = ObserveDocumentsUseCase.filterAndSort(listOf(tav, alef, bet), "", DocumentSort.TITLE_A_TO_Z, Locale.forLanguageTag("he-IL"))
        assertEquals(listOf(10L, 11L, 12L), ids(result))
    }

    @Test
    fun `emits again when query or source changes`() = runTest {
        val source = MutableStateFlow(listOf(lease))
        val query = MutableStateFlow("")
        val useCase = ObserveDocumentsUseCase(object : DocumentRepository {
            override fun observeDocuments(): Flow<List<Document>> = source
        })

        useCase(query, MutableStateFlow(DocumentSort.Default), Locale.US).test {
            assertEquals(listOf(1L), ids(awaitItem().documents))
            source.value = all
            assertEquals(listOf(1L, 3L, 2L), ids(awaitItem().documents))
            query.value = "lease"
            val filtered = awaitItem()
            assertEquals(listOf(1L), ids(filtered.documents))
            // The total still counts the whole library, so "no matches" differs from "empty".
            assertEquals(3, filtered.totalCount)
            assertEquals("lease", filtered.query)
        }
    }
}

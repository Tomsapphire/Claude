package com.tomsapphire.docscan.domain.usecase

import com.tomsapphire.docscan.domain.model.Document
import com.tomsapphire.docscan.domain.model.DocumentSort
import com.tomsapphire.docscan.domain.repository.DocumentRepository
import com.tomsapphire.docscan.domain.search.SearchNormalizer
import java.text.Collator
import java.util.Locale
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine

/**
 * One consistent snapshot of the library as filtered by [query] and ordered by [sort].
 * [totalCount] counts every document, so callers can tell "library empty" from "no matches".
 */
data class DocumentSearchResult(
    val documents: List<Document>,
    val totalCount: Int,
    val query: String,
    val sort: DocumentSort,
)

/**
 * Streams the documents matching a query, ordered by a sort. Every whitespace-separated
 * term of the query must appear in the title (see [SearchNormalizer] for what "appear" means).
 */
class ObserveDocumentsUseCase @Inject constructor(
    private val repository: DocumentRepository,
) {
    operator fun invoke(
        query: Flow<String>,
        sort: Flow<DocumentSort>,
        locale: Locale = Locale.getDefault(),
    ): Flow<DocumentSearchResult> =
        combine(repository.observeDocuments(), query, sort) { documents, q, s ->
            DocumentSearchResult(
                documents = filterAndSort(documents, q, s, locale),
                totalCount = documents.size,
                query = q,
                sort = s,
            )
        }

    companion object {
        fun filterAndSort(
            documents: List<Document>,
            query: String,
            sort: DocumentSort,
            locale: Locale,
        ): List<Document> {
            val terms = SearchNormalizer.terms(query)
            val matching = if (terms.isEmpty()) {
                documents
            } else {
                documents.filter { document ->
                    val title = SearchNormalizer.normalize(document.title)
                    terms.all(title::contains)
                }
            }
            return matching.sortedWith(comparatorFor(sort, locale))
        }

        private fun comparatorFor(sort: DocumentSort, locale: Locale): Comparator<Document> {
            val collator = Collator.getInstance(locale).apply { strength = Collator.SECONDARY }
            val byTitle = Comparator<Document> { a, b -> collator.compare(a.title, b.title) }
            // Stable, deterministic tie-breakers so equal keys never shuffle between emissions.
            val newestFirst = compareByDescending<Document> { it.updatedAt }.thenByDescending { it.id }
            return when (sort) {
                DocumentSort.UPDATED_NEWEST -> newestFirst
                DocumentSort.CREATED_NEWEST ->
                    compareByDescending<Document> { it.createdAt }.thenByDescending { it.id }
                DocumentSort.CREATED_OLDEST ->
                    compareBy<Document> { it.createdAt }.thenBy { it.id }
                DocumentSort.TITLE_A_TO_Z -> byTitle.then(newestFirst)
                DocumentSort.TITLE_Z_TO_A -> byTitle.reversed().then(newestFirst)
            }
        }
    }
}

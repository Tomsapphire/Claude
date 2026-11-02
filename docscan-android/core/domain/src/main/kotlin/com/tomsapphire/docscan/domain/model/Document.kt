package com.tomsapphire.docscan.domain.model

import java.time.Instant

/**
 * A scanned document as the rest of the app sees it. Pages, annotations and
 * signatures are separate aggregates that reference [id].
 */
data class Document(
    val id: Long,
    val title: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val pageCount: Int,
    /** Absolute path of a downsampled preview of the first page, or null before one exists. */
    val thumbnailPath: String?,
    val folderId: Long?,
)

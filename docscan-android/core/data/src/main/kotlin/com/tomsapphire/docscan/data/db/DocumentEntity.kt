package com.tomsapphire.docscan.data.db

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.tomsapphire.docscan.domain.model.Document
import java.time.Instant

@Entity(
    tableName = "documents",
    indices = [Index("folder_id"), Index("updated_at")],
)
data class DocumentEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    @ColumnInfo(name = "created_at") val createdAtMillis: Long,
    @ColumnInfo(name = "updated_at") val updatedAtMillis: Long,
    @ColumnInfo(name = "page_count") val pageCount: Int,
    @ColumnInfo(name = "thumbnail_path") val thumbnailPath: String?,
    @ColumnInfo(name = "folder_id") val folderId: Long?,
)

internal fun DocumentEntity.toDomain() = Document(
    id = id,
    title = title,
    createdAt = Instant.ofEpochMilli(createdAtMillis),
    updatedAt = Instant.ofEpochMilli(updatedAtMillis),
    pageCount = pageCount,
    thumbnailPath = thumbnailPath,
    folderId = folderId,
)

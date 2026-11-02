package com.tomsapphire.docscan.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface DocumentDao {
    @Query("SELECT * FROM documents")
    fun observeAll(): Flow<List<DocumentEntity>>

    @Insert
    suspend fun insert(document: DocumentEntity): Long

    @Query("DELETE FROM documents WHERE id = :id")
    suspend fun delete(id: Long)
}

package com.tomsapphire.docscan.data.repository

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import app.cash.turbine.test
import com.tomsapphire.docscan.data.db.DocScanDatabase
import com.tomsapphire.docscan.data.db.DocumentEntity
import java.time.Instant
import kotlin.test.AfterTest
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlinx.coroutines.test.runTest
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class RoomDocumentRepositoryTest {

    private lateinit var database: DocScanDatabase
    private lateinit var repository: RoomDocumentRepository

    @BeforeTest
    fun setUp() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, DocScanDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        repository = RoomDocumentRepository(database.documentDao())
    }

    @AfterTest
    fun tearDown() = database.close()

    @Test
    fun `maps entities to domain documents and reacts to changes`() = runTest {
        repository.observeDocuments().test {
            assertEquals(emptyList(), awaitItem())

            val id = database.documentDao().insert(
                DocumentEntity(
                    title = "Lease",
                    createdAtMillis = 1_000,
                    updatedAtMillis = 2_000,
                    pageCount = 3,
                    thumbnailPath = "/thumbs/1.webp",
                    folderId = null,
                ),
            )

            val document = awaitItem().single()
            assertEquals(id, document.id)
            assertEquals("Lease", document.title)
            assertEquals(Instant.ofEpochMilli(1_000), document.createdAt)
            assertEquals(Instant.ofEpochMilli(2_000), document.updatedAt)
            assertEquals(3, document.pageCount)

            database.documentDao().delete(id)
            assertEquals(emptyList(), awaitItem())
        }
    }
}

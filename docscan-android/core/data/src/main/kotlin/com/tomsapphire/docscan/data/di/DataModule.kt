package com.tomsapphire.docscan.data.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStoreFile
import androidx.room.Room
import com.tomsapphire.docscan.data.db.DocScanDatabase
import com.tomsapphire.docscan.data.db.DocumentDao
import com.tomsapphire.docscan.data.preferences.DataStoreUserPreferencesRepository
import com.tomsapphire.docscan.data.repository.RoomDocumentRepository
import com.tomsapphire.docscan.domain.repository.DocumentRepository
import com.tomsapphire.docscan.domain.repository.UserPreferencesRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
internal abstract class DataModule {

    @Binds
    abstract fun bindDocumentRepository(impl: RoomDocumentRepository): DocumentRepository

    @Binds
    abstract fun bindUserPreferencesRepository(
        impl: DataStoreUserPreferencesRepository,
    ): UserPreferencesRepository

    companion object {
        @Provides
        @Singleton
        fun provideDatabase(@ApplicationContext context: Context): DocScanDatabase =
            Room.databaseBuilder(context, DocScanDatabase::class.java, DocScanDatabase.NAME)
                .build()

        @Provides
        fun provideDocumentDao(database: DocScanDatabase): DocumentDao = database.documentDao()

        @Provides
        @Singleton
        fun providePreferencesDataStore(@ApplicationContext context: Context): DataStore<Preferences> =
            PreferenceDataStoreFactory.create(
                produceFile = { context.preferencesDataStoreFile("user_preferences") },
            )
    }
}

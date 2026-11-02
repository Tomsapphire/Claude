package com.tomsapphire.docscan.data.preferences

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import com.tomsapphire.docscan.domain.model.DocumentLayout
import com.tomsapphire.docscan.domain.model.DocumentSort
import com.tomsapphire.docscan.domain.repository.UserPreferencesRepository
import java.io.IOException
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map

internal class DataStoreUserPreferencesRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>,
) : UserPreferencesRepository {

    // A corrupt or unreadable file must not take the home screen down: fall back to defaults.
    private val preferences: Flow<Preferences> = dataStore.data.catch { error ->
        if (error is IOException) emit(emptyPreferences()) else throw error
    }

    override val documentSort: Flow<DocumentSort> = preferences
        .map { DocumentSort.fromNameOrDefault(it[Keys.SORT]) }
        .distinctUntilChanged()

    override val documentLayout: Flow<DocumentLayout> = preferences
        .map { DocumentLayout.fromNameOrDefault(it[Keys.LAYOUT]) }
        .distinctUntilChanged()

    override suspend fun setDocumentSort(sort: DocumentSort) {
        dataStore.edit { it[Keys.SORT] = sort.name }
    }

    override suspend fun setDocumentLayout(layout: DocumentLayout) {
        dataStore.edit { it[Keys.LAYOUT] = layout.name }
    }

    private object Keys {
        val SORT = stringPreferencesKey("document_sort")
        val LAYOUT = stringPreferencesKey("document_layout")
    }
}

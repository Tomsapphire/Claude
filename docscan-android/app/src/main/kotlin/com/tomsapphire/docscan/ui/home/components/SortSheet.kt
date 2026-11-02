package com.tomsapphire.docscan.ui.home.components

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.tomsapphire.docscan.R
import com.tomsapphire.docscan.domain.model.DocumentSort

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun SortSheet(
    selected: DocumentSort,
    onSelect: (DocumentSort) -> Unit,
    onDismiss: () -> Unit,
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
    ) {
        SortOptions(selected = selected, onSelect = onSelect)
    }
}

@Composable
internal fun SortOptions(
    selected: DocumentSort,
    onSelect: (DocumentSort) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier.padding(bottom = 16.dp)) {
        Text(
            text = stringResource(R.string.sort_title),
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier
                .padding(horizontal = 24.dp, vertical = 8.dp)
                .semantics { heading() },
        )
        Column(Modifier.selectableGroup()) {
            DocumentSort.entries.forEach { sort ->
                val isSelected = sort == selected
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 56.dp)
                        .selectable(selected = isSelected, role = Role.RadioButton, onClick = { onSelect(sort) })
                        .padding(horizontal = 24.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    // The row is the touch target; the radio button is purely visual.
                    RadioButton(selected = isSelected, onClick = null)
                    Spacer(Modifier.width(16.dp))
                    Text(stringResource(sort.label), style = MaterialTheme.typography.bodyLarge)
                }
            }
        }
    }
}

@get:StringRes
private val DocumentSort.label: Int
    get() = when (this) {
        DocumentSort.UPDATED_NEWEST -> R.string.sort_updated_newest
        DocumentSort.CREATED_NEWEST -> R.string.sort_created_newest
        DocumentSort.CREATED_OLDEST -> R.string.sort_created_oldest
        DocumentSort.TITLE_A_TO_Z -> R.string.sort_title_a_to_z
        DocumentSort.TITLE_Z_TO_A -> R.string.sort_title_z_to_a
    }

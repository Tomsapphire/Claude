package com.tomsapphire.docscan.ui.home

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Sort
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DocumentScanner
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.ViewAgenda
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SearchBarDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.TopAppBarScrollBehavior
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tomsapphire.docscan.R
import com.tomsapphire.docscan.domain.model.DocumentLayout
import com.tomsapphire.docscan.domain.model.DocumentSort
import com.tomsapphire.docscan.ui.home.components.DocumentGrid
import com.tomsapphire.docscan.ui.home.components.DocumentList
import com.tomsapphire.docscan.ui.home.components.EmptyLibrary
import com.tomsapphire.docscan.ui.home.components.NoResults
import com.tomsapphire.docscan.ui.home.components.SortSheet
import com.tomsapphire.docscan.ui.theme.DocScanMotion

@Composable
fun HomeRoute(
    onScanClick: () -> Unit,
    onDocumentClick: (Long) -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    HomeScreen(
        state = state,
        query = viewModel.query,
        onQueryChange = viewModel::onQueryChange,
        onSortChange = viewModel::onSortChange,
        onToggleLayout = viewModel::onToggleLayout,
        onScanClick = onScanClick,
        onDocumentClick = onDocumentClick,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    state: HomeUiState,
    query: String,
    onQueryChange: (String) -> Unit,
    onSortChange: (DocumentSort) -> Unit,
    onToggleLayout: () -> Unit,
    onScanClick: () -> Unit,
    onDocumentClick: (Long) -> Unit,
    modifier: Modifier = Modifier,
    initiallyShowSortSheet: Boolean = false,
) {
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    var showSortSheet by rememberSaveable { mutableStateOf(initiallyShowSortSheet) }
    val gridState = rememberLazyGridState()
    val listState = rememberLazyListState()
    val layout by rememberUpdatedState(state.layout)
    // The FAB shows its label at the top of the collection and shrinks to an icon once scrolled.
    val fabExpanded by remember {
        derivedStateOf {
            when (layout) {
                DocumentLayout.GRID -> gridState.firstVisibleItemIndex == 0
                DocumentLayout.LIST -> listState.firstVisibleItemIndex == 0
            }
        }
    }

    // Show the date the list is ordered by, so "Newest first" never looks out of order.
    val showCreatedDate = state.sort == DocumentSort.CREATED_NEWEST || state.sort == DocumentSort.CREATED_OLDEST

    Scaffold(
        modifier = modifier.nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            HomeTopBar(
                query = query,
                onQueryChange = onQueryChange,
                layout = state.layout,
                showActions = state.content != HomeContent.EmptyLibrary,
                onToggleLayout = onToggleLayout,
                onSortClick = { showSortSheet = true },
                scrollBehavior = scrollBehavior,
            )
        },
        floatingActionButton = {
            val scanDescription = stringResource(R.string.home_scan_description)
            ExtendedFloatingActionButton(
                text = { Text(stringResource(R.string.home_scan)) },
                icon = { Icon(Icons.Filled.DocumentScanner, contentDescription = null) },
                onClick = onScanClick,
                expanded = fabExpanded || state.content != HomeContent.Documents,
                modifier = Modifier.semantics { contentDescription = scanDescription },
            )
        },
    ) { padding ->
        AnimatedContent(
            targetState = state.content to state.layout,
            transitionSpec = {
                (fadeIn(DocScanMotion.effects()) + scaleIn(DocScanMotion.spatial(), initialScale = 0.96f))
                    .togetherWith(fadeOut(DocScanMotion.effects()))
            },
            contentKey = { (content, layout) -> if (content == HomeContent.Documents) "$content-$layout" else content },
            label = "home-content",
        ) { (content, contentLayout) ->
            when (content) {
                HomeContent.Loading -> Box(Modifier.fillMaxSize())
                HomeContent.EmptyLibrary -> EmptyLibrary(contentPadding = padding)
                HomeContent.NoResults -> NoResults(query = state.searchedQuery, contentPadding = padding)
                HomeContent.Documents -> when (contentLayout) {
                    DocumentLayout.GRID -> DocumentGrid(
                        documents = state.documents,
                        showCreatedDate = showCreatedDate,
                        onDocumentClick = onDocumentClick,
                        contentPadding = padding,
                        state = gridState,
                    )
                    DocumentLayout.LIST -> DocumentList(
                        documents = state.documents,
                        showCreatedDate = showCreatedDate,
                        onDocumentClick = onDocumentClick,
                        contentPadding = padding,
                        state = listState,
                    )
                }
            }
        }
    }

    if (showSortSheet) {
        SortSheet(
            selected = state.sort,
            onSelect = {
                onSortChange(it)
                showSortSheet = false
            },
            onDismiss = { showSortSheet = false },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun HomeTopBar(
    query: String,
    onQueryChange: (String) -> Unit,
    layout: DocumentLayout,
    showActions: Boolean,
    onToggleLayout: () -> Unit,
    onSortClick: () -> Unit,
    scrollBehavior: TopAppBarScrollBehavior,
) {
    val surface = MaterialTheme.colorScheme.surface
    Column(Modifier.fillMaxWidth()) {
        LargeTopAppBar(
            title = { Text(stringResource(R.string.home_title)) },
            actions = {
                AnimatedVisibility(visible = showActions, enter = fadeIn(), exit = fadeOut()) {
                    Row {
                        IconButton(onClick = onToggleLayout) {
                            val (icon, description) = when (layout) {
                                DocumentLayout.GRID -> Icons.Outlined.ViewAgenda to R.string.home_show_list
                                DocumentLayout.LIST -> Icons.Outlined.GridView to R.string.home_show_grid
                            }
                            Icon(icon, contentDescription = stringResource(description))
                        }
                        IconButton(onClick = onSortClick) {
                            Icon(
                                Icons.AutoMirrored.Filled.Sort,
                                contentDescription = stringResource(R.string.home_sort),
                            )
                        }
                    }
                }
            },
            // The search field sits under the bar, so keep one flat surface instead of
            // tinting only the bar when content scrolls.
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = surface,
                scrolledContainerColor = surface,
            ),
            scrollBehavior = scrollBehavior,
        )
        if (showActions) {
            HomeSearchField(
                query = query,
                onQueryChange = onQueryChange,
                // Aligned with the title; capped so it stays a comfortable width on tablets.
                modifier = Modifier
                    .widthIn(max = 720.dp)
                    .fillMaxWidth()
                    .padding(start = 16.dp, end = 16.dp, bottom = 8.dp),
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun HomeSearchField(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val focusManager = LocalFocusManager.current
    Surface(
        modifier = modifier,
        shape = SearchBarDefaults.inputFieldShape,
        color = MaterialTheme.colorScheme.surfaceContainerHigh,
    ) {
        SearchBarDefaults.InputField(
            query = query,
            onQueryChange = onQueryChange,
            // Results filter live as the user types; the keyboard action just dismisses it.
            onSearch = { focusManager.clearFocus() },
            expanded = false,
            onExpandedChange = {},
            placeholder = { Text(stringResource(R.string.home_search_placeholder)) },
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
            trailingIcon = {
                AnimatedVisibility(
                    visible = query.isNotEmpty(),
                    enter = fadeIn() + scaleIn(),
                    exit = fadeOut() + scaleOut(),
                ) {
                    IconButton(onClick = { onQueryChange("") }) {
                        Icon(Icons.Filled.Close, contentDescription = stringResource(R.string.home_search_clear))
                    }
                }
            },
        )
    }
}


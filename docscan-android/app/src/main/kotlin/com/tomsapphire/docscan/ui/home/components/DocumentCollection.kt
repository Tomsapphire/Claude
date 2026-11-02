package com.tomsapphire.docscan.ui.home.components

import android.text.format.DateUtils
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.calculateEndPadding
import androidx.compose.foundation.layout.calculateStartPadding
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyGridState
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.ListItem
import androidx.compose.material3.ListItemDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import com.tomsapphire.docscan.R
import com.tomsapphire.docscan.domain.model.Document
import java.io.File
import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime
import kotlin.random.Random

/** Width over height of an A4 page in portrait. */
private const val PAGE_ASPECT_RATIO = 1f / 1.414f

/** Space below the last item so the floating Scan button never covers it. */
private val FabClearance = 96.dp

@Composable
internal fun DocumentGrid(
    documents: List<Document>,
    showCreatedDate: Boolean,
    onDocumentClick: (Long) -> Unit,
    contentPadding: PaddingValues,
    state: LazyGridState,
    modifier: Modifier = Modifier,
) {
    LazyVerticalGrid(
        // Adaptive columns: two on a phone, more on tablets, foldables and landscape.
        columns = GridCells.Adaptive(minSize = 156.dp),
        modifier = modifier.fillMaxSize(),
        state = state,
        contentPadding = contentPadding.plusCollection(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        items(documents, key = { it.id }) { document ->
            DocumentGridItem(
                document = document,
                showCreatedDate = showCreatedDate,
                onClick = { onDocumentClick(document.id) },
                modifier = Modifier.animateItem(),
            )
        }
    }
}

@Composable
internal fun DocumentList(
    documents: List<Document>,
    showCreatedDate: Boolean,
    onDocumentClick: (Long) -> Unit,
    contentPadding: PaddingValues,
    state: LazyListState,
    modifier: Modifier = Modifier,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        state = state,
        contentPadding = contentPadding.plusCollection(horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        items(documents, key = { it.id }) { document ->
            ListItem(
                headlineContent = {
                    Text(document.title, maxLines = 1, overflow = TextOverflow.Ellipsis)
                },
                supportingContent = { Text(documentMeta(document, showCreatedDate), maxLines = 1) },
                leadingContent = {
                    DocumentThumbnail(
                        document = document,
                        shape = MaterialTheme.shapes.small,
                        modifier = Modifier
                            .width(44.dp)
                            .aspectRatio(PAGE_ASPECT_RATIO),
                    )
                },
                colors = ListItemDefaults.colors(containerColor = Color.Transparent),
                modifier = Modifier
                    .animateItem()
                    // Keep rows readable on tablets instead of stretching edge to edge.
                    .widthIn(max = 840.dp)
                    .fillMaxWidth()
                    .clip(MaterialTheme.shapes.large)
                    .clickable { onDocumentClick(document.id) },
            )
        }
    }
}

@Composable
private fun DocumentGridItem(
    document: Document,
    showCreatedDate: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    // clickable() merges the children's semantics, so TalkBack reads title and details as one item.
    Column(
        modifier = modifier
            .clip(MaterialTheme.shapes.large)
            .clickable(onClick = onClick)
            .padding(6.dp),
    ) {
        DocumentThumbnail(
            document = document,
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(PAGE_ASPECT_RATIO),
        )
        Spacer(Modifier.height(10.dp))
        Text(
            text = document.title,
            style = MaterialTheme.typography.titleSmall,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(horizontal = 4.dp),
        )
        Text(
            text = documentMeta(document, showCreatedDate),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(start = 4.dp, end = 4.dp, top = 2.dp),
        )
    }
}

@Composable
internal fun DocumentThumbnail(
    document: Document,
    modifier: Modifier = Modifier,
    shape: Shape = MaterialTheme.shapes.medium,
) {
    val colors = MaterialTheme.colorScheme
    val isDark = colors.surface.luminance() < 0.5f
    Surface(
        modifier = modifier,
        shape = shape,
        // Paper stays paper-like: white in light theme, a dimmed sheet in dark theme.
        color = if (isDark) colors.surfaceContainerHigh else colors.surfaceContainerLowest,
        border = BorderStroke(1.dp, colors.outlineVariant.copy(alpha = 0.6f)),
        shadowElevation = 1.dp,
    ) {
        Box(Modifier.fillMaxSize()) {
            // Drawn underneath, so it also shows while the image loads or if it fails.
            PagePlaceholder(seed = document.id)
            document.thumbnailPath?.let { path ->
                AsyncImage(
                    model = File(path),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
            }
        }
    }
}

/** Abstract lines of text, so a page without a preview still reads as a document. */
@Composable
private fun PagePlaceholder(seed: Long, modifier: Modifier = Modifier) {
    val lineColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.16f)
    val headingColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.32f)
    Canvas(modifier.fillMaxSize()) {
        val margin = size.width * 0.14f
        val lineHeight = size.height * 0.022f
        val gap = size.height * 0.056f
        val textWidth = size.width - margin * 2
        val rtl = layoutDirection == LayoutDirection.Rtl
        fun line(y: Float, width: Float, color: Color, height: Float = lineHeight) {
            val x = if (rtl) size.width - margin - width else margin
            drawRoundRect(color, Offset(x, y), Size(width, height), CornerRadius(height / 2))
        }

        var y = size.height * 0.12f
        line(y, textWidth * 0.5f, headingColor, lineHeight * 1.6f)
        y += gap * 1.7f
        val random = Random(seed)
        while (y < size.height - margin) {
            val paragraphEnd = random.nextInt(5) == 0
            val fraction = if (paragraphEnd) 0.45f + random.nextFloat() * 0.25f else 0.86f + random.nextFloat() * 0.14f
            line(y, textWidth * fraction, lineColor)
            y += if (paragraphEnd) gap * 1.6f else gap
        }
    }
}

@Composable
private fun documentMeta(document: Document, showCreatedDate: Boolean): String {
    val context = LocalContext.current
    val pages = pluralStringResource(R.plurals.home_page_count, document.pageCount, document.pageCount)
    val instant: Instant = if (showCreatedDate) document.createdAt else document.updatedAt
    // DateUtils localizes month names; the year is only shown when it is not this year.
    val date = remember(instant) {
        val zone = ZoneId.systemDefault()
        val sameYear = instant.atZone(zone).year == ZonedDateTime.now(zone).year
        val yearFlag = if (sameYear) DateUtils.FORMAT_NO_YEAR else DateUtils.FORMAT_SHOW_YEAR
        DateUtils.formatDateTime(
            context,
            instant.toEpochMilli(),
            DateUtils.FORMAT_SHOW_DATE or DateUtils.FORMAT_ABBREV_MONTH or yearFlag,
        )
    }
    return stringResource(R.string.home_document_meta, pages, date)
}

@Composable
private fun PaddingValues.plusCollection(horizontal: Dp): PaddingValues {
    val layoutDirection = LocalLayoutDirection.current
    return PaddingValues(
        start = calculateStartPadding(layoutDirection) + horizontal,
        end = calculateEndPadding(layoutDirection) + horizontal,
        top = calculateTopPadding() + 8.dp,
        bottom = calculateBottomPadding() + FabClearance,
    )
}

package com.tomsapphire.docscan.domain.model

/** Orders offered on the home screen. Persisted by [name], so never rename an entry. */
enum class DocumentSort {
    UPDATED_NEWEST,
    CREATED_NEWEST,
    CREATED_OLDEST,
    TITLE_A_TO_Z,
    TITLE_Z_TO_A;

    companion object {
        val Default = UPDATED_NEWEST

        fun fromNameOrDefault(name: String?): DocumentSort =
            entries.firstOrNull { it.name == name } ?: Default
    }
}

/** How the document collection is laid out on the home screen. Persisted by [name]. */
enum class DocumentLayout {
    GRID,
    LIST;

    companion object {
        val Default = GRID

        fun fromNameOrDefault(name: String?): DocumentLayout =
            entries.firstOrNull { it.name == name } ?: Default
    }
}

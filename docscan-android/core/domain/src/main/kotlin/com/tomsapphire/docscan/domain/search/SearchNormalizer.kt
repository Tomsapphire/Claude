package com.tomsapphire.docscan.domain.search

import java.text.Normalizer
import java.util.Locale

/**
 * Folds text into a form where "what the user typed" and "what the document is called"
 * compare equal when a person would consider them equal:
 *
 * - case-insensitive (`Invoice` ≈ `invoice`),
 * - accent- and niqqud-insensitive (`café` ≈ `cafe`, `שָׁלוֹם` ≈ `שלום`),
 * - Hebrew final letters fold to their regular forms, so a query typed mid-word
 *   (`שלומ`) still finds `שלומות`.
 */
object SearchNormalizer {

    private val finalLetters = mapOf(
        'ך' to 'כ',
        'ם' to 'מ',
        'ן' to 'נ',
        'ף' to 'פ',
        'ץ' to 'צ',
    )

    fun normalize(text: String): String {
        val decomposed = Normalizer.normalize(text, Normalizer.Form.NFD)
        val builder = StringBuilder(decomposed.length)
        for (char in decomposed) {
            if (Character.getType(char) == Character.NON_SPACING_MARK.toInt()) continue
            builder.append(finalLetters[char] ?: char)
        }
        return builder.toString().lowercase(Locale.ROOT)
    }

    /** Splits a raw query into normalized, non-blank terms. */
    fun terms(query: String): List<String> =
        normalize(query).split(Regex("\\s+")).filter { it.isNotEmpty() }
}

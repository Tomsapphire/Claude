package com.tomsapphire.docscan.domain.search

import kotlin.test.Test
import kotlin.test.assertEquals

class SearchNormalizerTest {

    @Test
    fun `folds case and latin accents`() {
        assertEquals("cafe receipt", SearchNormalizer.normalize("Café RECEIPT"))
    }

    @Test
    fun `strips hebrew niqqud`() {
        assertEquals("שלומ", SearchNormalizer.normalize("שָׁלוֹם"))
    }

    @Test
    fun `folds hebrew final letters to regular forms`() {
        assertEquals("כמנפצ", SearchNormalizer.normalize("ךםןףץ"))
    }

    @Test
    fun `splits query into non blank terms`() {
        assertEquals(listOf("tax", "2026"), SearchNormalizer.terms("  Tax   2026 "))
        assertEquals(emptyList(), SearchNormalizer.terms("   "))
    }
}

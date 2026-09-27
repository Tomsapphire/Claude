package com.aivideodetector

/** Remembers recent results so a video seen again (scrolling back, loops) is not re-analyzed. */
class ScoreCache(private val capacity: Int) {

    private val entries = object : LinkedHashMap<Long, Float>(capacity, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<Long, Float>?) =
            size > capacity
    }

    /** Score of a cached frame that looks like [hash], or null. */
    fun find(hash: Long): Float? {
        entries[hash]?.let { return it }
        val match = entries.keys.firstOrNull { FrameHash.distance(it, hash) <= MATCH_DISTANCE }
            ?: return null
        return entries[match]
    }

    fun put(hash: Long, score: Float) {
        entries[hash] = score
    }

    private companion object {
        const val MATCH_DISTANCE = 6
    }
}

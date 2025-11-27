package com.absensi.data.local

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

/**
 * Local storage for face embeddings.
 * Uses SharedPreferences to store embeddings for offline face recognition.
 */
class EmbeddingStorage(context: Context) {

    companion object {
        private const val TAG = "EmbeddingStorage"
        private const val PREFS_NAME = "face_embeddings_prefs"
        private const val KEY_EMBEDDINGS = "embeddings"
        private const val KEY_LAST_SYNC = "last_sync_timestamp"
        private const val KEY_SYNC_VERSION = "sync_version"
        private const val KEY_FACE_THRESHOLD = "face_distance_threshold"
        private const val DEFAULT_FACE_THRESHOLD = 0.7f  // Default fallback threshold (higher = more lenient)
    }

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val gson = Gson()

    /**
     * Data class representing a stored user embedding
     * Supports multiple embeddings per user for better accuracy
     */
    data class UserEmbedding(
        val odId: String,                    // User's OD ID (unique identifier)
        val name: String,                     // User's name for display
        val embedding: FloatArray,            // Primary 192-dimensional face embedding (for backward compatibility)
        val embeddings: List<FloatArray> = listOf(),  // Multiple embeddings for better matching
        val faceImageUrl: String? = null,     // Face image URL for confirmation dialog
        val updatedAt: Long                   // Timestamp when this embedding was last updated
    ) {
        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (javaClass != other?.javaClass) return false
            other as UserEmbedding
            return odId == other.odId
        }

        override fun hashCode(): Int = odId.hashCode()

        /**
         * Get all embeddings (multiple if available, else single wrapped in list)
         */
        fun getAllEmbeddings(): List<FloatArray> {
            return if (embeddings.isNotEmpty()) embeddings else listOf(embedding)
        }
    }

    /**
     * Save all embeddings to storage.
     * This replaces all existing embeddings.
     * Supports multiple embeddings per user.
     */
    fun saveEmbeddings(embeddings: List<UserEmbedding>) {
        try {
            // Convert FloatArray to List<Float> for JSON serialization
            val serializableList = embeddings.map { user ->
                mapOf(
                    "odId" to user.odId,
                    "name" to user.name,
                    "embedding" to user.embedding.toList(),
                    "embeddings" to user.embeddings.map { it.toList() },  // Multiple embeddings
                    "faceImageUrl" to user.faceImageUrl,  // Face image URL
                    "updatedAt" to user.updatedAt
                )
            }

            val json = gson.toJson(serializableList)
            prefs.edit().putString(KEY_EMBEDDINGS, json).apply()
            Log.d(TAG, "Saved ${embeddings.size} users (with multiple embeddings) to storage")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save embeddings: ${e.message}")
        }
    }

    /**
     * Load all embeddings from storage.
     * Supports both single and multiple embeddings per user.
     */
    fun loadEmbeddings(): List<UserEmbedding> {
        return try {
            val json = prefs.getString(KEY_EMBEDDINGS, null) ?: return emptyList()

            val type = object : TypeToken<List<Map<String, Any>>>() {}.type
            val rawList: List<Map<String, Any>> = gson.fromJson(json, type)

            rawList.map { map ->
                @Suppress("UNCHECKED_CAST")
                val embeddingList = map["embedding"] as List<Double>
                val primaryEmbedding = embeddingList.map { it.toFloat() }.toFloatArray()

                // Load multiple embeddings if available
                @Suppress("UNCHECKED_CAST")
                val multiEmbeddings: List<FloatArray> = try {
                    val embeddingsList = map["embeddings"] as? List<List<Double>>
                    embeddingsList?.map { emb ->
                        emb.map { it.toFloat() }.toFloatArray()
                    } ?: listOf()
                } catch (e: Exception) {
                    listOf()  // No multiple embeddings, use empty list
                }

                UserEmbedding(
                    odId = map["odId"] as String,
                    name = map["name"] as String,
                    embedding = primaryEmbedding,
                    embeddings = multiEmbeddings,
                    faceImageUrl = map["faceImageUrl"] as? String,
                    updatedAt = (map["updatedAt"] as Double).toLong()
                )
            }.also {
                val totalEmbeddings = it.sumOf { user -> user.getAllEmbeddings().size }
                Log.d(TAG, "Loaded ${it.size} users with $totalEmbeddings total embeddings from storage")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load embeddings: ${e.message}")
            emptyList()
        }
    }

    /**
     * Get embeddings as a map for quick lookup (single embedding per user).
     * Key: odId, Value: FloatArray embedding
     * Legacy method for backward compatibility.
     */
    fun getEmbeddingsMap(): Map<String, FloatArray> {
        return loadEmbeddings().associate { it.odId to it.embedding }
    }

    /**
     * Get multiple embeddings as a map for better matching.
     * Key: odId, Value: List<FloatArray> all embeddings
     */
    fun getMultiEmbeddingsMap(): Map<String, List<FloatArray>> {
        return loadEmbeddings().associate { it.odId to it.getAllEmbeddings() }
    }

    /**
     * Get user info by OD ID.
     */
    fun getUserByOdId(odId: String): UserEmbedding? {
        return loadEmbeddings().find { it.odId == odId }
    }

    /**
     * Get user info map (odId -> name).
     */
    fun getUserNamesMap(): Map<String, String> {
        return loadEmbeddings().associate { it.odId to it.name }
    }

    /**
     * Get user face image URL map (odId -> faceImageUrl).
     */
    fun getFaceImageUrlMap(): Map<String, String?> {
        return loadEmbeddings().associate { it.odId to it.faceImageUrl }
    }

    /**
     * Add or update a single embedding.
     */
    fun saveOrUpdateEmbedding(userEmbedding: UserEmbedding) {
        val embeddings = loadEmbeddings().toMutableList()
        val existingIndex = embeddings.indexOfFirst { it.odId == userEmbedding.odId }

        if (existingIndex >= 0) {
            embeddings[existingIndex] = userEmbedding
            Log.d(TAG, "Updated embedding for user: ${userEmbedding.odId}")
        } else {
            embeddings.add(userEmbedding)
            Log.d(TAG, "Added new embedding for user: ${userEmbedding.odId}")
        }

        saveEmbeddings(embeddings)
    }

    /**
     * Remove an embedding by OD ID.
     */
    fun removeEmbedding(odId: String) {
        val embeddings = loadEmbeddings().toMutableList()
        val removed = embeddings.removeAll { it.odId == odId }
        if (removed) {
            saveEmbeddings(embeddings)
            Log.d(TAG, "Removed embedding for user: $odId")
        }
    }

    /**
     * Clear all embeddings.
     */
    fun clearAll() {
        prefs.edit().clear().apply()
        Log.d(TAG, "Cleared all embeddings from storage")
    }

    /**
     * Save last sync timestamp.
     */
    fun setLastSyncTimestamp(timestamp: Long) {
        prefs.edit().putLong(KEY_LAST_SYNC, timestamp).apply()
    }

    /**
     * Get last sync timestamp.
     */
    fun getLastSyncTimestamp(): Long {
        return prefs.getLong(KEY_LAST_SYNC, 0)
    }

    /**
     * Save sync version (for incremental sync).
     */
    fun setSyncVersion(version: Int) {
        prefs.edit().putInt(KEY_SYNC_VERSION, version).apply()
    }

    /**
     * Get sync version.
     */
    fun getSyncVersion(): Int {
        return prefs.getInt(KEY_SYNC_VERSION, 0)
    }

    /**
     * Check if embeddings are available.
     */
    fun hasEmbeddings(): Boolean {
        return loadEmbeddings().isNotEmpty()
    }

    /**
     * Get count of stored embeddings.
     */
    fun getEmbeddingsCount(): Int {
        return loadEmbeddings().size
    }

    /**
     * Save face distance threshold from server settings.
     * This threshold is used for on-device face matching.
     */
    fun saveFaceThreshold(threshold: Float) {
        prefs.edit().putFloat(KEY_FACE_THRESHOLD, threshold).apply()
        Log.d(TAG, "Saved face threshold: $threshold")
    }

    /**
     * Get face distance threshold.
     * Returns the synced threshold from server, or default if not set.
     */
    fun getFaceThreshold(): Float {
        val threshold = prefs.getFloat(KEY_FACE_THRESHOLD, DEFAULT_FACE_THRESHOLD)
        Log.d(TAG, "Loaded face threshold: $threshold")
        return threshold
    }

    /**
     * Check if threshold has been synced from server.
     */
    fun hasThreshold(): Boolean {
        return prefs.contains(KEY_FACE_THRESHOLD)
    }
}

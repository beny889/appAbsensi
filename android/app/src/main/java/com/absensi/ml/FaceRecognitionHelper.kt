package com.absensi.ml

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.gpu.GpuDelegate
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import kotlin.math.sqrt

/**
 * Helper class for face recognition using MobileFaceNet TFLite model.
 *
 * MobileFaceNet produces 192-dimensional face embeddings.
 * Use Euclidean distance to compare embeddings:
 * - Distance < 1.0: Same person (threshold can be adjusted)
 * - Distance >= 1.0: Different person
 */
class FaceRecognitionHelper(private val context: Context) {

    companion object {
        private const val TAG = "FaceRecognitionHelper"
        private const val MODEL_FILE = "mobile_face_net.tflite"
        private const val INPUT_SIZE = 112  // MobileFaceNet input size
        private const val EMBEDDING_SIZE = 192  // MobileFaceNet embedding dimension
        private const val PIXEL_SIZE = 3  // RGB
        private const val IMAGE_MEAN = 127.5f
        private const val IMAGE_STD = 127.5f

        // Distance threshold for face matching
        // Lower = more strict, Higher = more lenient
        // MobileFaceNet recommended: 0.6-0.8 for high security
        const val DISTANCE_THRESHOLD = 0.7f
    }

    private var interpreter: Interpreter? = null
    private var gpuDelegate: GpuDelegate? = null
    private var isInitialized = false

    /**
     * Initialize the TFLite interpreter.
     * Call this before using other methods.
     *
     * @param useGpu Whether to use GPU acceleration (if available)
     */
    fun initialize(useGpu: Boolean = false) {
        if (isInitialized) {
            Log.d(TAG, "FaceRecognitionHelper already initialized")
            return
        }

        try {
            val options = Interpreter.Options()

            // Try to use GPU if requested (disabled by default due to compatibility issues)
            if (useGpu) {
                try {
                    gpuDelegate = GpuDelegate()
                    options.addDelegate(gpuDelegate)
                    Log.d(TAG, "GPU delegate enabled")
                } catch (e: Exception) {
                    Log.w(TAG, "GPU delegate not available, using CPU: ${e.message}")
                    gpuDelegate = null
                } catch (e: Error) {
                    // Catch NoClassDefFoundError for missing GPU classes
                    Log.w(TAG, "GPU delegate classes not found, using CPU: ${e.message}")
                    gpuDelegate = null
                }
            }

            // Set number of threads for CPU
            options.setNumThreads(4)

            // Load model
            val model = loadModelFile()
            interpreter = Interpreter(model, options)
            isInitialized = true

            Log.d(TAG, "FaceRecognitionHelper initialized successfully (GPU: ${gpuDelegate != null})")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize FaceRecognitionHelper: ${e.message}")
            throw e
        }
    }

    /**
     * Extract face embedding from a bitmap.
     *
     * @param faceBitmap Cropped face bitmap (should be just the face region)
     * @return FloatArray of 192 dimensions representing the face
     */
    fun extractEmbedding(faceBitmap: Bitmap): FloatArray {
        if (!isInitialized) {
            throw IllegalStateException("FaceRecognitionHelper not initialized. Call initialize() first.")
        }

        // Resize bitmap to model input size
        val resizedBitmap = Bitmap.createScaledBitmap(faceBitmap, INPUT_SIZE, INPUT_SIZE, true)

        // Convert bitmap to ByteBuffer
        val inputBuffer = convertBitmapToByteBuffer(resizedBitmap)

        // Prepare output buffer
        val outputBuffer = Array(1) { FloatArray(EMBEDDING_SIZE) }

        // Run inference
        interpreter?.run(inputBuffer, outputBuffer)

        // Normalize embedding (L2 normalization)
        val embedding = outputBuffer[0]
        val norm = sqrt(embedding.map { it * it }.sum())
        if (norm > 0) {
            for (i in embedding.indices) {
                embedding[i] = embedding[i] / norm
            }
        }

        Log.d(TAG, "Extracted embedding with ${embedding.size} dimensions")
        return embedding
    }

    /**
     * Calculate Euclidean distance between two embeddings.
     *
     * @param embedding1 First face embedding
     * @param embedding2 Second face embedding
     * @return Euclidean distance (lower = more similar)
     */
    fun calculateDistance(embedding1: FloatArray, embedding2: FloatArray): Float {
        if (embedding1.size != embedding2.size) {
            throw IllegalArgumentException("Embedding dimensions do not match: ${embedding1.size} vs ${embedding2.size}")
        }

        var sum = 0f
        for (i in embedding1.indices) {
            val diff = embedding1[i] - embedding2[i]
            sum += diff * diff
        }
        return sqrt(sum)
    }

    /**
     * Check if two face embeddings belong to the same person.
     *
     * @param embedding1 First face embedding
     * @param embedding2 Second face embedding
     * @param threshold Distance threshold (default: DISTANCE_THRESHOLD)
     * @return Pair of (isMatch, distance)
     */
    fun compareFaces(
        embedding1: FloatArray,
        embedding2: FloatArray,
        threshold: Float = DISTANCE_THRESHOLD
    ): Pair<Boolean, Float> {
        val distance = calculateDistance(embedding1, embedding2)
        val isMatch = distance < threshold
        Log.d(TAG, "Face comparison: distance=$distance, threshold=$threshold, isMatch=$isMatch")
        return Pair(isMatch, distance)
    }

    /**
     * Find the best matching face from a list of embeddings (single embedding per user).
     * Legacy method for backward compatibility.
     *
     * @param targetEmbedding The embedding to match against
     * @param storedEmbeddings Map of userId to embedding
     * @param threshold Distance threshold
     * @return Pair of (userId, distance) or null if no match found
     */
    fun findBestMatch(
        targetEmbedding: FloatArray,
        storedEmbeddings: Map<String, FloatArray>,
        threshold: Float = DISTANCE_THRESHOLD
    ): Pair<String, Float>? {
        var bestMatch: String? = null
        var bestDistance = Float.MAX_VALUE

        for ((userId, embedding) in storedEmbeddings) {
            val distance = calculateDistance(targetEmbedding, embedding)
            Log.d(TAG, "Comparing with user $userId: distance=$distance")

            if (distance < bestDistance) {
                bestDistance = distance
                bestMatch = userId
            }
        }

        return if (bestMatch != null && bestDistance < threshold) {
            Log.d(TAG, "Best match found: userId=$bestMatch, distance=$bestDistance")
            Pair(bestMatch, bestDistance)
        } else {
            Log.d(TAG, "No match found. Best distance: $bestDistance (threshold: $threshold)")
            null
        }
    }

    /**
     * Data class for match result with logging information
     */
    data class UserMatchInfo(
        val odId: String,
        val name: String,
        val distance: Float,
        val similarity: Int,  // percentage (0-100)
        val isMatch: Boolean
    )

    data class MatchResultWithLog(
        val bestMatch: Pair<String, Float>?,  // odId, distance
        val allMatches: List<UserMatchInfo>    // all users with their distances
    )

    /**
     * Find the best matching face from multiple embeddings per user.
     * This provides better accuracy by comparing against all stored face angles.
     *
     * @param targetEmbedding The embedding to match against
     * @param storedMultiEmbeddings Map of userId to list of embeddings
     * @param threshold Distance threshold
     * @return Pair of (userId, distance) or null if no match found
     */
    fun findBestMatchMulti(
        targetEmbedding: FloatArray,
        storedMultiEmbeddings: Map<String, List<FloatArray>>,
        threshold: Float = DISTANCE_THRESHOLD
    ): Pair<String, Float>? {
        var bestMatch: String? = null
        var bestDistance = Float.MAX_VALUE

        for ((userId, embeddingsList) in storedMultiEmbeddings) {
            // Find the best distance among all embeddings for this user
            var userBestDistance = Float.MAX_VALUE

            for ((index, embedding) in embeddingsList.withIndex()) {
                try {
                    val distance = calculateDistance(targetEmbedding, embedding)
                    if (distance < userBestDistance) {
                        userBestDistance = distance
                    }
                    Log.d(TAG, "User $userId emb[$index]: distance=$distance")
                } catch (e: Exception) {
                    Log.w(TAG, "Error comparing embedding $index for user $userId: ${e.message}")
                }
            }

            Log.d(TAG, "User $userId best distance: $userBestDistance (from ${embeddingsList.size} embeddings)")

            if (userBestDistance < bestDistance) {
                bestDistance = userBestDistance
                bestMatch = userId
            }
        }

        return if (bestMatch != null && bestDistance < threshold) {
            Log.d(TAG, "Best match found: userId=$bestMatch, distance=$bestDistance")
            Pair(bestMatch, bestDistance)
        } else {
            Log.d(TAG, "No match found. Best distance: $bestDistance (threshold: $threshold)")
            null
        }
    }

    /**
     * Find the best matching face with detailed logging for all users.
     * Returns both the best match and comparison details for all users.
     *
     * @param targetEmbedding The embedding to match against
     * @param storedMultiEmbeddings Map of userId to list of embeddings
     * @param userNames Map of userId to user name
     * @param threshold Distance threshold
     * @return MatchResultWithLog containing best match and all user comparisons
     */
    fun findBestMatchMultiWithLog(
        targetEmbedding: FloatArray,
        storedMultiEmbeddings: Map<String, List<FloatArray>>,
        userNames: Map<String, String>,
        threshold: Float = DISTANCE_THRESHOLD
    ): MatchResultWithLog {
        val allMatches = mutableListOf<UserMatchInfo>()
        var bestMatch: String? = null
        var bestDistance = Float.MAX_VALUE

        Log.d(TAG, "═══════════════════════════════════════════")
        Log.d(TAG, "🔍 FACE MATCHING DEBUG LOG")
        Log.d(TAG, "═══════════════════════════════════════════")
        Log.d(TAG, "Threshold: $threshold (${(threshold * 100).toInt()}%)")
        Log.d(TAG, "Total users to compare: ${storedMultiEmbeddings.size}")
        Log.d(TAG, "───────────────────────────────────────────")

        for ((userId, embeddingsList) in storedMultiEmbeddings) {
            // Find the best distance among all embeddings for this user
            var userBestDistance = Float.MAX_VALUE

            for ((index, embedding) in embeddingsList.withIndex()) {
                try {
                    val distance = calculateDistance(targetEmbedding, embedding)
                    if (distance < userBestDistance) {
                        userBestDistance = distance
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Error comparing embedding $index for user $userId: ${e.message}")
                }
            }

            // Calculate similarity percentage: (1 - distance/2) * 100, clamped to 0-100
            val similarity = ((1 - userBestDistance / 2) * 100).toInt().coerceIn(0, 100)
            val isMatch = userBestDistance < threshold
            val userName = userNames[userId] ?: "Unknown"

            allMatches.add(UserMatchInfo(
                odId = userId,
                name = userName,
                distance = userBestDistance,
                similarity = similarity,
                isMatch = isMatch
            ))

            if (userBestDistance < bestDistance) {
                bestDistance = userBestDistance
                bestMatch = userId
            }
        }

        // Sort by distance (best matches first)
        allMatches.sortBy { it.distance }

        // Log ranking
        Log.d(TAG, "📊 RANKING (sorted by distance):")
        allMatches.forEachIndexed { index, match ->
            val status = if (match.isMatch) "✓ MATCH" else "✗ NO MATCH"
            Log.d(TAG, "${index + 1}. ${match.name}: distance=${"%.4f".format(match.distance)} | similarity=${match.similarity}% | $status")
        }
        Log.d(TAG, "═══════════════════════════════════════════")

        val result = if (bestMatch != null && bestDistance < threshold) {
            Log.d(TAG, "✓ Best match: ${userNames[bestMatch]} (distance=${"%.4f".format(bestDistance)})")
            Pair(bestMatch, bestDistance)
        } else {
            Log.d(TAG, "✗ No match found. Best distance: ${"%.4f".format(bestDistance)} (threshold: $threshold)")
            null
        }

        return MatchResultWithLog(result, allMatches)
    }

    /**
     * Convert bitmap to ByteBuffer for TFLite input.
     */
    private fun convertBitmapToByteBuffer(bitmap: Bitmap): ByteBuffer {
        val byteBuffer = ByteBuffer.allocateDirect(4 * INPUT_SIZE * INPUT_SIZE * PIXEL_SIZE)
        byteBuffer.order(ByteOrder.nativeOrder())

        val pixels = IntArray(INPUT_SIZE * INPUT_SIZE)
        bitmap.getPixels(pixels, 0, INPUT_SIZE, 0, 0, INPUT_SIZE, INPUT_SIZE)

        for (pixel in pixels) {
            // Normalize pixel values to [-1, 1]
            val r = ((pixel shr 16 and 0xFF) - IMAGE_MEAN) / IMAGE_STD
            val g = ((pixel shr 8 and 0xFF) - IMAGE_MEAN) / IMAGE_STD
            val b = ((pixel and 0xFF) - IMAGE_MEAN) / IMAGE_STD

            byteBuffer.putFloat(r)
            byteBuffer.putFloat(g)
            byteBuffer.putFloat(b)
        }

        return byteBuffer
    }

    /**
     * Load TFLite model file from assets.
     */
    private fun loadModelFile(): MappedByteBuffer {
        val assetFileDescriptor = context.assets.openFd(MODEL_FILE)
        val inputStream = FileInputStream(assetFileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = assetFileDescriptor.startOffset
        val declaredLength = assetFileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }

    /**
     * Release resources.
     */
    fun close() {
        interpreter?.close()
        interpreter = null
        gpuDelegate?.close()
        gpuDelegate = null
        isInitialized = false
        Log.d(TAG, "FaceRecognitionHelper closed")
    }
}

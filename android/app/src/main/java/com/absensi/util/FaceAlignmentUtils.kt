package com.absensi.util

import android.graphics.Bitmap
import android.graphics.Matrix
import android.graphics.Rect
import android.util.Log
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceLandmark
import kotlin.math.atan2
import kotlin.math.sqrt

/**
 * Face Alignment Utility
 *
 * Provides face alignment and cropping based on ML Kit landmarks.
 * This improves face recognition accuracy by:
 * 1. Rotating face to make eyes horizontal
 * 2. Cropping consistently based on eye distance
 * 3. Positioning eyes at fixed location in output
 */
object FaceAlignmentUtils {

    private const val TAG = "FaceAlignmentUtils"

    // Output size for aligned face (matches MobileFaceNet input)
    private const val OUTPUT_SIZE = 112

    // Eye position in output (35% from top)
    private const val EYE_Y_RATIO = 0.35f

    // Face width relative to eye distance
    private const val FACE_WIDTH_RATIO = 2.5f

    /**
     * Align and crop face based on eye positions from ML Kit landmarks
     *
     * @param bitmap Full camera frame bitmap
     * @param face ML Kit Face object with detected landmarks
     * @return Aligned and cropped face bitmap, or null if landmarks not available
     */
    fun alignAndCropFace(bitmap: Bitmap, face: Face): Bitmap? {
        try {
            // Get eye landmarks
            val leftEye = face.getLandmark(FaceLandmark.LEFT_EYE)?.position
            val rightEye = face.getLandmark(FaceLandmark.RIGHT_EYE)?.position

            if (leftEye == null || rightEye == null) {
                Log.w(TAG, "Eye landmarks not detected, falling back to bounding box")
                return cropFaceFromBoundingBox(bitmap, face.boundingBox)
            }

            // Calculate angle between eyes (for rotation)
            val deltaX = rightEye.x - leftEye.x
            val deltaY = rightEye.y - leftEye.y
            val angle = Math.toDegrees(atan2(deltaY.toDouble(), deltaX.toDouble())).toFloat()

            // Calculate eye distance (for scaling)
            val eyeDistance = sqrt(deltaX * deltaX + deltaY * deltaY)

            // Calculate center between eyes
            val centerX = (leftEye.x + rightEye.x) / 2
            val centerY = (leftEye.y + rightEye.y) / 2

            // Calculate crop size based on eye distance
            val cropSize = (eyeDistance * FACE_WIDTH_RATIO).toInt()

            // Minimum crop size check
            if (cropSize < 50) {
                Log.w(TAG, "Face too small (cropSize=$cropSize), using bounding box")
                return cropFaceFromBoundingBox(bitmap, face.boundingBox)
            }

            // Step 1: Rotate bitmap to align eyes horizontally
            val rotationMatrix = Matrix()
            rotationMatrix.postRotate(-angle, centerX, centerY)

            val rotatedBitmap = try {
                Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, rotationMatrix, true)
            } catch (e: Exception) {
                Log.e(TAG, "Rotation failed: ${e.message}")
                return cropFaceFromBoundingBox(bitmap, face.boundingBox)
            }

            // Step 2: Calculate crop coordinates
            // Eyes should be at EYE_Y_RATIO from top
            val eyeYOffset = (cropSize * EYE_Y_RATIO).toInt()

            var cropX = (centerX - cropSize / 2).toInt()
            var cropY = (centerY - eyeYOffset).toInt()

            // Ensure crop is within bounds
            cropX = cropX.coerceIn(0, maxOf(0, rotatedBitmap.width - cropSize))
            cropY = cropY.coerceIn(0, maxOf(0, rotatedBitmap.height - cropSize))

            // Adjust crop size if near edge
            val actualWidth = minOf(cropSize, rotatedBitmap.width - cropX)
            val actualHeight = minOf(cropSize, rotatedBitmap.height - cropY)

            if (actualWidth < 50 || actualHeight < 50) {
                Log.w(TAG, "Crop area too small, using bounding box")
                rotatedBitmap.recycle()
                return cropFaceFromBoundingBox(bitmap, face.boundingBox)
            }

            // Step 3: Crop aligned face
            val croppedFace = Bitmap.createBitmap(
                rotatedBitmap, cropX, cropY, actualWidth, actualHeight
            )

            // Recycle rotated bitmap if different from input
            if (rotatedBitmap != bitmap) {
                rotatedBitmap.recycle()
            }

            // Step 4: Resize to output size
            val alignedFace = Bitmap.createScaledBitmap(croppedFace, OUTPUT_SIZE, OUTPUT_SIZE, true)

            if (croppedFace != alignedFace) {
                croppedFace.recycle()
            }

            Log.d(TAG, "Face aligned: angle=${String.format("%.1f", angle)}°, eyeDist=${String.format("%.0f", eyeDistance)}")

            return alignedFace

        } catch (e: Exception) {
            Log.e(TAG, "Face alignment error: ${e.message}")
            return cropFaceFromBoundingBox(bitmap, face.boundingBox)
        }
    }

    /**
     * Fallback: Crop face using bounding box only (no alignment)
     *
     * @param bitmap Source bitmap
     * @param boundingBox Face bounding box from ML Kit
     * @param padding Padding ratio (default 20%)
     * @return Cropped face bitmap
     */
    fun cropFaceFromBoundingBox(bitmap: Bitmap, boundingBox: Rect, padding: Float = 0.2f): Bitmap {
        val padW = (boundingBox.width() * padding).toInt()
        val padH = (boundingBox.height() * padding).toInt()

        // Calculate crop coordinates with padding
        var x = (boundingBox.left - padW).coerceAtLeast(0)
        var y = (boundingBox.top - padH).coerceAtLeast(0)
        var width = boundingBox.width() + padW * 2
        var height = boundingBox.height() + padH * 2

        // Ensure within bitmap bounds
        width = width.coerceAtMost(bitmap.width - x)
        height = height.coerceAtMost(bitmap.height - y)

        // Minimum size check
        if (width < 20 || height < 20) {
            Log.w(TAG, "Bounding box too small, returning resized full bitmap")
            return Bitmap.createScaledBitmap(bitmap, OUTPUT_SIZE, OUTPUT_SIZE, true)
        }

        val croppedFace = Bitmap.createBitmap(bitmap, x, y, width, height)

        // Resize to output size
        val resizedFace = Bitmap.createScaledBitmap(croppedFace, OUTPUT_SIZE, OUTPUT_SIZE, true)

        if (croppedFace != resizedFace) {
            croppedFace.recycle()
        }

        Log.d(TAG, "Face cropped from bounding box: ${width}x${height}")

        return resizedFace
    }
}

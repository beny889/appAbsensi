package com.absensi.util

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Matrix
import android.graphics.Rect
import android.graphics.YuvImage
import android.util.Base64
import androidx.camera.core.ImageProxy
import java.io.ByteArrayOutputStream

object ImageUtils {

    /**
     * Convert ImageProxy to Base64 string
     * Used for face registration - captures image from camera
     */
    fun imageProxyToBase64(image: ImageProxy): String {
        val bitmap = imageProxyToBitmap(image)
        return bitmapToBase64(bitmap)
    }

    /**
     * Convert ImageProxy to Bitmap with correct rotation
     * Made public for face alignment processing
     */
    fun imageProxyToBitmap(image: ImageProxy): Bitmap {
        val yBuffer = image.planes[0].buffer
        val uBuffer = image.planes[1].buffer
        val vBuffer = image.planes[2].buffer

        val ySize = yBuffer.remaining()
        val uSize = uBuffer.remaining()
        val vSize = vBuffer.remaining()

        val nv21 = ByteArray(ySize + uSize + vSize)

        yBuffer.get(nv21, 0, ySize)
        vBuffer.get(nv21, ySize, vSize)
        uBuffer.get(nv21, ySize + vSize, uSize)

        val yuvImage = YuvImage(nv21, ImageFormat.NV21, image.width, image.height, null)
        val out = ByteArrayOutputStream()
        yuvImage.compressToJpeg(Rect(0, 0, image.width, image.height), 85, out)
        val imageBytes = out.toByteArray()

        val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)

        // Apply rotation from ImageProxy metadata (important for front camera!)
        val rotationDegrees = image.imageInfo.rotationDegrees
        return rotateBitmap(bitmap, rotationDegrees)
    }

    /**
     * Rotate bitmap by specified degrees
     * Used to correct camera orientation (especially front camera which is often 270°)
     */
    private fun rotateBitmap(bitmap: Bitmap, degrees: Int): Bitmap {
        if (degrees == 0) return bitmap

        val matrix = Matrix()
        matrix.postRotate(degrees.toFloat())

        return Bitmap.createBitmap(
            bitmap,
            0,
            0,
            bitmap.width,
            bitmap.height,
            matrix,
            true
        ).also {
            // Recycle original bitmap to free memory
            if (bitmap != it) {
                bitmap.recycle()
            }
        }
    }

    /**
     * Convert Bitmap to Base64 string
     */
    fun bitmapToBase64(bitmap: Bitmap, quality: Int = 85): String {
        val byteArrayOutputStream = ByteArrayOutputStream()

        // Resize if too large (max 800x800 to reduce payload size)
        val resized = if (bitmap.width > 800 || bitmap.height > 800) {
            val ratio = minOf(800f / bitmap.width, 800f / bitmap.height)
            val newWidth = (bitmap.width * ratio).toInt()
            val newHeight = (bitmap.height * ratio).toInt()
            Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
        } else {
            bitmap
        }

        resized.compress(Bitmap.CompressFormat.JPEG, quality, byteArrayOutputStream)
        val byteArray = byteArrayOutputStream.toByteArray()

        return Base64.encodeToString(byteArray, Base64.NO_WRAP)
    }

    /**
     * Convert Base64 string back to Bitmap (for displaying)
     * Returns null if decoding fails
     */
    fun base64ToBitmap(base64String: String): Bitmap? {
        return try {
            // Use NO_WRAP to match encoding flag used in bitmapToBase64
            val decodedBytes = Base64.decode(base64String, Base64.NO_WRAP)
            val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            if (bitmap == null) {
                android.util.Log.e("ImageUtils", "Failed to decode bitmap from base64, length: ${base64String.length}")
            }
            bitmap
        } catch (e: Exception) {
            android.util.Log.e("ImageUtils", "Exception decoding base64 to bitmap: ${e.message}")
            null
        }
    }
}

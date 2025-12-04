package com.absensi.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * Request DTO for submitting face registration
 * Can use either faceImageBase64 (server extracts embedding)
 * or faceEmbedding (pre-computed on device)
 * For better accuracy, use multiple embeddings (faceEmbeddings/faceImagesBase64)
 */
data class SubmitFaceRegistrationRequest(
    @SerializedName("name")
    val name: String,

    @SerializedName("faceImageBase64")
    val faceImageBase64: String? = null,

    @SerializedName("faceEmbedding")
    val faceEmbedding: String? = null,  // JSON array of floats (e.g., "[0.1, 0.2, ...]")

    @SerializedName("faceImageUrl")
    val faceImageUrl: String? = null,  // Data URL for display

    // Multiple embeddings for better accuracy (5 angles)
    @SerializedName("faceEmbeddings")
    val faceEmbeddings: List<String>? = null,  // Array of JSON embedding strings

    @SerializedName("faceImagesBase64")
    val faceImagesBase64: List<String>? = null,  // Array of base64 images

    // Branch ID for multi-branch support (from device's selected branch)
    @SerializedName("branchId")
    val branchId: String? = null
)

/**
 * Response DTO for face registration submission
 */
data class FaceRegistrationResponse(
    @SerializedName("id")
    val id: String,

    @SerializedName("message")
    val message: String,

    @SerializedName("status")
    val status: String, // PENDING, APPROVED, REJECTED

    @SerializedName("embeddingsCount")
    val embeddingsCount: Int? = null  // Number of face embeddings stored
)

/**
 * Face Registration model (for listing)
 */
data class FaceRegistration(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("faceImageUrl")
    val faceImageUrl: String?,

    @SerializedName("status")
    val status: String,

    @SerializedName("createdAt")
    val createdAt: String,

    @SerializedName("updatedAt")
    val updatedAt: String
)

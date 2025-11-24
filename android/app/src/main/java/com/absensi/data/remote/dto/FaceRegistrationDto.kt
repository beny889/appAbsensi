package com.absensi.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * Request DTO for submitting face registration
 */
data class SubmitFaceRegistrationRequest(
    @SerializedName("name")
    val name: String,

    @SerializedName("faceImageBase64")
    val faceImageBase64: String
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
    val status: String // PENDING, APPROVED, REJECTED
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

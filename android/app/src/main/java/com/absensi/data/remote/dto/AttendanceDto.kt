package com.absensi.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * Request to verify face and create attendance (no location required)
 */
data class VerifyAttendanceRequest(
    @SerializedName("type")
    val type: String, // CHECK_IN or CHECK_OUT

    @SerializedName("faceEmbedding")
    val faceEmbedding: String // JSON string of face embedding array
)

/**
 * Response after successful attendance creation
 */
data class AttendanceResponse(
    @SerializedName("id")
    val id: String,

    @SerializedName("userId")
    val userId: String,

    @SerializedName("type")
    val type: String,

    @SerializedName("timestamp")
    val timestamp: String,

    @SerializedName("similarity")
    val similarity: Double?,

    // Late/Early tracking
    @SerializedName("isLate")
    val isLate: Boolean? = null,

    @SerializedName("lateMinutes")
    val lateMinutes: Int? = null,

    @SerializedName("isEarlyCheckout")
    val isEarlyCheckout: Boolean? = null,

    @SerializedName("earlyMinutes")
    val earlyMinutes: Int? = null,

    @SerializedName("scheduledTime")
    val scheduledTime: String? = null,

    @SerializedName("user")
    val user: UserInfo?,

    // Matched user info (for anonymous verification)
    @SerializedName("matchedUser")
    val matchedUser: UserInfo? = null
)

data class UserInfo(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("email")
    val email: String? = null, // Nullable for EMPLOYEE

    @SerializedName("position")
    val position: String? = null, // Position/jabatan

    @SerializedName("faceImageUrl")
    val faceImageUrl: String? = null, // Face image URL (base64 data URI)

    @SerializedName("department")
    val department: DepartmentInfo? = null // Department info
)

data class DepartmentInfo(
    @SerializedName("name")
    val name: String
)

/**
 * Response when fetching today's attendance
 */
data class TodayAttendanceResponse(
    @SerializedName("checkIn")
    val checkIn: AttendanceResponse?,

    @SerializedName("checkOut")
    val checkOut: AttendanceResponse?
)

/**
 * Response when fetching attendance history
 */
data class AttendanceHistoryResponse(
    @SerializedName("attendances")
    val attendances: List<AttendanceResponse>
)

/**
 * Response for user's work schedule
 */
data class ScheduleInfoResponse(
    @SerializedName("hasSchedule")
    val hasSchedule: Boolean,

    @SerializedName("checkInTime")
    val checkInTime: String? = null,

    @SerializedName("checkOutTime")
    val checkOutTime: String? = null,

    @SerializedName("departmentName")
    val departmentName: String? = null,

    @SerializedName("message")
    val message: String? = null
)

/**
 * Request for verify face only (without creating attendance)
 */
data class VerifyFaceOnlyRequest(
    @SerializedName("faceEmbedding")
    val faceEmbedding: String
)

/**
 * Response for verify face only
 * Used for early checkout confirmation flow
 */
data class VerifyFaceOnlyResponse(
    @SerializedName("verified")
    val verified: Boolean,

    @SerializedName("userId")
    val userId: String,

    @SerializedName("userName")
    val userName: String,

    @SerializedName("similarity")
    val similarity: Double,

    @SerializedName("departmentName")
    val departmentName: String? = null,

    @SerializedName("hasSchedule")
    val hasSchedule: Boolean,

    @SerializedName("checkInTime")
    val checkInTime: String? = null,

    @SerializedName("checkOutTime")
    val checkOutTime: String? = null
)

/**
 * Response for grouped daily attendance (one record per user)
 * Used for public today-all endpoint
 */
data class GroupedAttendanceResponse(
    @SerializedName("id")
    val id: String,

    @SerializedName("userId")
    val userId: String,

    @SerializedName("user")
    val user: UserInfo?,

    @SerializedName("checkInTime")
    val checkInTime: String? = null, // Timestamp waktu masuk

    @SerializedName("checkOutTime")
    val checkOutTime: String? = null, // Timestamp waktu pulang

    @SerializedName("checkInTimestamp")
    val checkInTimestamp: String? = null,

    @SerializedName("checkOutTimestamp")
    val checkOutTimestamp: String? = null,

    @SerializedName("latestActivity")
    val latestActivity: String? = null // For sorting by recent activity
)

/**
 * Response for sync embeddings endpoint
 * Returns all approved user embeddings for on-device face recognition
 * Supports multiple embeddings per user for better accuracy
 */
data class SyncEmbeddingsResponse(
    @SerializedName("count")
    val count: Int,

    @SerializedName("embeddings")
    val embeddings: List<UserEmbeddingDto>,

    @SerializedName("syncTimestamp")
    val syncTimestamp: Long,

    @SerializedName("supportsMultipleEmbeddings")
    val supportsMultipleEmbeddings: Boolean? = false
)

/**
 * Single user embedding for on-device face recognition
 * Supports multiple embeddings per user for better matching accuracy
 */
data class UserEmbeddingDto(
    @SerializedName("odId")
    val odId: String,

    @SerializedName("name")
    val name: String,

    // Primary embedding (for backward compatibility)
    @SerializedName("embedding")
    val embedding: List<Float>,

    // Multiple embeddings for better matching (new)
    @SerializedName("embeddings")
    val embeddings: List<List<Float>>? = null,

    // Count of embeddings for this user
    @SerializedName("embeddingsCount")
    val embeddingsCount: Int? = 1,

    @SerializedName("updatedAt")
    val updatedAt: Long
)

/**
 * Request for device-verified attendance
 * Called when Android verifies face on-device using MobileFaceNet
 */
data class VerifyDeviceRequest(
    @SerializedName("odId")
    val odId: String,

    @SerializedName("type")
    val type: String, // CHECK_IN or CHECK_OUT

    @SerializedName("distance")
    val distance: Float? = null,

    @SerializedName("similarity")
    val similarity: Float? = null
)

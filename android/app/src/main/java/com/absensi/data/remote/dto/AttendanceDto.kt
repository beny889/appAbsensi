package com.absensi.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * Request to verify face and location, then create attendance
 */
data class VerifyAttendanceRequest(
    @SerializedName("type")
    val type: String, // CHECK_IN or CHECK_OUT

    @SerializedName("latitude")
    val latitude: Double,

    @SerializedName("longitude")
    val longitude: Double,

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

    @SerializedName("latitude")
    val latitude: Double,

    @SerializedName("longitude")
    val longitude: Double,

    @SerializedName("locationId")
    val locationId: String?,

    @SerializedName("similarity")
    val similarity: Double?,

    @SerializedName("user")
    val user: UserInfo?,

    @SerializedName("location")
    val location: LocationInfo?
)

data class UserInfo(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("email")
    val email: String
)

data class LocationInfo(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("address")
    val address: String?
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

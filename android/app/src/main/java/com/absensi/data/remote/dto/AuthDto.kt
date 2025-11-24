package com.absensi.data.remote.dto

import com.google.gson.annotations.SerializedName

// Login Request
data class LoginRequest(
    @SerializedName("email")
    val email: String,
    @SerializedName("password")
    val password: String
)

// Login Response
data class LoginResponse(
    @SerializedName("user")
    val user: UserDto,
    @SerializedName("token")
    val token: String
)

// User DTO
data class UserDto(
    @SerializedName("id")
    val id: String,
    @SerializedName("email")
    val email: String,
    @SerializedName("name")
    val name: String,
    @SerializedName("role")
    val role: String,
    @SerializedName("phone")
    val phone: String?,
    @SerializedName("position")
    val position: String?,
    @SerializedName("department")
    val department: String?,
    @SerializedName("faceImageUrl")
    val faceImageUrl: String?,
    @SerializedName("isActive")
    val isActive: Boolean
)

// Register Request
data class RegisterRequest(
    @SerializedName("email")
    val email: String,
    @SerializedName("password")
    val password: String,
    @SerializedName("name")
    val name: String,
    @SerializedName("phone")
    val phone: String? = null,
    @SerializedName("position")
    val position: String? = null,
    @SerializedName("department")
    val department: String? = null
)

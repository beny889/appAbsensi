package com.absensi.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * Request to use a binding code (bind device)
 */
data class UseBindingRequest(
    @SerializedName("code")
    val code: String,

    @SerializedName("deviceName")
    val deviceName: String?
)

/**
 * Request to validate binding code (on app startup)
 */
data class ValidateBindingRequest(
    @SerializedName("code")
    val code: String
)

/**
 * Response for verify binding endpoint
 */
data class VerifyBindingResponse(
    @SerializedName("valid")
    val valid: Boolean,

    @SerializedName("branch")
    val branch: BranchDto?,

    @SerializedName("message")
    val message: String?
)

/**
 * Response for use binding endpoint
 */
data class UseBindingResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("binding")
    val binding: BindingInfo?,

    @SerializedName("branch")
    val branch: BranchDto?,

    @SerializedName("message")
    val message: String?
)

/**
 * Binding info included in use response
 */
data class BindingInfo(
    @SerializedName("id")
    val id: String,

    @SerializedName("code")
    val code: String,

    @SerializedName("branchId")
    val branchId: String
)

/**
 * Response for validate binding endpoint
 */
data class ValidateBindingResponse(
    @SerializedName("valid")
    val valid: Boolean,

    @SerializedName("branch")
    val branch: BranchDto?,

    @SerializedName("message")
    val message: String?
)

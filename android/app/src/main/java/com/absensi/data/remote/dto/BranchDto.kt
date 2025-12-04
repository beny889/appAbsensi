package com.absensi.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * Branch DTO for API responses
 * Used for branch selection on first app launch
 */
data class BranchDto(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("code")
    val code: String,

    @SerializedName("city")
    val city: String? = null
)

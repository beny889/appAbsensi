package com.absensi.domain.model

data class AttendanceRecord(
    val id: String,
    val userName: String,
    val userPosition: String,
    val checkInTime: String,
    val checkOutTime: String,
    val date: String
)

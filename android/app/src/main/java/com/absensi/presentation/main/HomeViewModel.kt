package com.absensi.presentation.main

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.absensi.data.repository.AttendanceRepository
import com.absensi.domain.model.AttendanceRecord
import com.absensi.util.TokenManager
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import java.util.TimeZone

class HomeViewModel(application: Application) : AndroidViewModel(application) {

    private val attendanceRepository = AttendanceRepository()
    private val tokenManager = TokenManager(application.applicationContext)

    private val _todayAttendanceList = MutableLiveData<List<AttendanceRecord>>()
    val todayAttendanceList: LiveData<List<AttendanceRecord>> = _todayAttendanceList

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val _errorMessage = MutableLiveData<String?>()
    val errorMessage: LiveData<String?> = _errorMessage

    private val timeFormat = SimpleDateFormat("HH:mm", Locale("id", "ID"))
    private val TAG = "HomeViewModel"

    // NOTE: Tidak memanggil loadTodayAttendance() di init
    // untuk menghindari race condition dengan observer di Fragment.
    // Fragment harus memanggil loadTodayAttendance() setelah setupObservers()

    fun loadTodayAttendance() {
        _isLoading.value = true
        _errorMessage.value = null

        viewModelScope.launch {
            try {

                // Use public endpoint - no token required
                val result = attendanceRepository.getTodayAllAttendance()

                result.fold(
                    onSuccess = { attendanceList ->

                        // Convert grouped API response to domain model
                        // Response is already grouped by user with checkInTime and checkOutTime
                        val records = attendanceList.map { attendance ->
                            AttendanceRecord(
                                id = attendance.id,
                                userName = attendance.user?.name ?: "Unknown",
                                userPosition = attendance.user?.department?.name ?: "", // Tampilkan departemen
                                checkInTime = attendance.checkInTime?.let { formatTime(it) } ?: "",
                                checkOutTime = attendance.checkOutTime?.let { formatTime(it) } ?: "",
                                date = attendance.latestActivity?.let { formatDate(it) } ?: "",
                                faceImageUrl = attendance.user?.faceImageUrl
                            )
                        }

                        _todayAttendanceList.value = records
                        _isLoading.value = false
                    },
                    onFailure = { error ->
                        Log.e(TAG, "✗ Failed to fetch attendance: ${error.message}")
                        _errorMessage.value = error.message
                        _todayAttendanceList.value = emptyList()
                        _isLoading.value = false
                    }
                )
            } catch (e: Exception) {
                Log.e(TAG, "Exception loading attendance", e)
                _errorMessage.value = e.message
                _todayAttendanceList.value = emptyList()
                _isLoading.value = false
            }
        }
    }

    private fun formatTime(timestamp: String): String {
        return try {
            // Backend returns UTC timestamps, parse with UTC timezone
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            inputFormat.timeZone = TimeZone.getTimeZone("UTC")

            // Output format uses local timezone (WIB)
            val outputFormat = SimpleDateFormat("HH:mm", Locale("id", "ID"))
            outputFormat.timeZone = TimeZone.getDefault() // Local timezone

            val date = inputFormat.parse(timestamp)
            outputFormat.format(date!!)
        } catch (e: Exception) {
            Log.e(TAG, "Error formatting time: $timestamp", e)
            timestamp
        }
    }

    private fun formatDate(timestamp: String): String {
        return try {
            // Backend returns UTC timestamps, parse with UTC timezone
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            inputFormat.timeZone = TimeZone.getTimeZone("UTC")

            // Output format uses local timezone
            val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale("id", "ID"))
            dateFormat.timeZone = TimeZone.getDefault()

            val date = inputFormat.parse(timestamp)
            dateFormat.format(date!!)
        } catch (e: Exception) {
            Log.e(TAG, "Error formatting date: $timestamp", e)
            timestamp
        }
    }
}

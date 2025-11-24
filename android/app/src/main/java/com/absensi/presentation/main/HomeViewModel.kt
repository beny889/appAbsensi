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

    init {
        loadTodayAttendance()
    }

    fun loadTodayAttendance() {
        val token = tokenManager.getToken()
        if (token == null) {
            Log.w(TAG, "No token found - user not logged in")
            _todayAttendanceList.value = emptyList()
            return
        }

        _isLoading.value = true
        _errorMessage.value = null

        viewModelScope.launch {
            try {
                Log.d(TAG, "Fetching today's attendance from API...")

                val result = attendanceRepository.getTodayAttendance(token)

                result.fold(
                    onSuccess = { attendanceList ->
                        Log.d(TAG, "✓ Fetched ${attendanceList.size} attendance records")

                        // Convert API response to domain model
                        val records = attendanceList.map { attendance ->
                            AttendanceRecord(
                                id = attendance.id,
                                userName = attendance.user?.name ?: "Unknown",
                                userPosition = "", // Position not in attendance response
                                checkInTime = if (attendance.type == "CHECK_IN") {
                                    formatTime(attendance.timestamp)
                                } else "",
                                checkOutTime = if (attendance.type == "CHECK_OUT") {
                                    formatTime(attendance.timestamp)
                                } else "",
                                date = formatDate(attendance.timestamp)
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
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val date = inputFormat.parse(timestamp)
            timeFormat.format(date!!)
        } catch (e: Exception) {
            Log.e(TAG, "Error formatting time: $timestamp", e)
            timestamp
        }
    }

    private fun formatDate(timestamp: String): String {
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale("id", "ID"))
            val date = inputFormat.parse(timestamp)
            dateFormat.format(date!!)
        } catch (e: Exception) {
            Log.e(TAG, "Error formatting date: $timestamp", e)
            timestamp
        }
    }
}

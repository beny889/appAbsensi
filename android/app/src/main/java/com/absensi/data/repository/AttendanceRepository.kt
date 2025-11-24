package com.absensi.data.repository

import android.util.Log
import com.absensi.data.remote.api.RetrofitClient
import com.absensi.data.remote.dto.AttendanceResponse
import com.absensi.data.remote.dto.VerifyAttendanceRequest
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

/**
 * Repository for handling attendance operations
 * - Verify face and location, then create attendance (check-in/check-out)
 * - Fetch today's attendance
 * - Fetch attendance history
 */
class AttendanceRepository {

    private val apiService = RetrofitClient.apiService
    private val TAG = "AttendanceRepository"

    /**
     * Verify face and location, then create attendance
     * @param token JWT authentication token (format: "Bearer <token>")
     * @param type "CHECK_IN" or "CHECK_OUT"
     * @param latitude User's current latitude
     * @param longitude User's current longitude
     * @param faceEmbedding JSON string of face embedding array
     * @return Result with AttendanceResponse or error
     */
    suspend fun verifyAndCreateAttendance(
        token: String,
        type: String,
        latitude: Double,
        longitude: Double,
        faceEmbedding: String
    ): Result<AttendanceResponse> {
        return try {
            Log.d(TAG, "Verifying and creating attendance: type=$type, lat=$latitude, lng=$longitude")
            Log.d(TAG, "Token: ${token.take(20)}...")
            Log.d(TAG, "Face embedding length: ${faceEmbedding.length}")

            val request = VerifyAttendanceRequest(
                type = type,
                latitude = latitude,
                longitude = longitude,
                faceEmbedding = faceEmbedding
            )

            val response = apiService.verifyAndCreateAttendance(token, request)

            Log.d(TAG, "Response code: ${response.code()}")
            Log.d(TAG, "Response message: ${response.message()}")

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✓ Attendance created successfully")
                Result.success(response.body()!!)
            } else {
                val errorBody = response.errorBody()?.string()
                val errorMsg = when (response.code()) {
                    401 -> {
                        if (errorBody?.contains("pending approval") == true) {
                            "Registrasi wajah Anda menunggu persetujuan admin. Silakan tunggu."
                        } else if (errorBody?.contains("rejected") == true) {
                            "Registrasi wajah ditolak. Silakan hubungi admin atau daftar ulang."
                        } else if (errorBody?.contains("Face verification failed") == true) {
                            "Verifikasi wajah gagal. Wajah tidak cocok dengan data terdaftar."
                        } else {
                            "Unauthorized. Silakan login ulang."
                        }
                    }
                    400 -> {
                        if (errorBody?.contains("not registered") == true) {
                            "Wajah belum terdaftar. Silakan rekam data wajah terlebih dahulu."
                        } else if (errorBody?.contains("already checked in") == true) {
                            "Anda sudah check-in hari ini."
                        } else if (errorBody?.contains("must check in before") == true) {
                            "Anda harus check-in terlebih dahulu sebelum check-out."
                        } else if (errorBody?.contains("already checked out") == true) {
                            "Anda sudah check-out hari ini."
                        } else if (errorBody?.contains("outside the allowed location") == true) {
                            "Anda berada di luar area yang diizinkan."
                        } else if (errorBody?.contains("inactive") == true) {
                            "Akun Anda tidak aktif. Silakan hubungi admin."
                        } else {
                            "Bad request: ${errorBody ?: "Unknown error"}"
                        }
                    }
                    404 -> "User tidak ditemukan."
                    500 -> "Server error. Silakan coba lagi nanti."
                    else -> "Error ${response.code()}: ${errorBody ?: response.message()}"
                }
                Log.e(TAG, "✗ Error: $errorMsg")
                Log.e(TAG, "Error body: $errorBody")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: ConnectException) {
            val msg = "Tidak dapat terhubung ke server.\n" +
                    "1. Pastikan backend running\n" +
                    "2. Cek koneksi internet\n" +
                    "3. Setup ADB reverse"
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: SocketTimeoutException) {
            val msg = "Request timeout. Server terlalu lama merespons."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: UnknownHostException) {
            val msg = "Cannot resolve host. Periksa BASE_URL di konfigurasi."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: Exception) {
            val msg = "Unexpected error: ${e.message}"
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        }
    }

    /**
     * Anonymous check-in/check-out (NO authentication required)
     * Uses face recognition to identify user automatically
     * @param type "CHECK_IN" or "CHECK_OUT"
     * @param latitude User's current latitude
     * @param longitude User's current longitude
     * @param faceEmbedding JSON string of face embedding array
     * @return Result with AttendanceResponse including matched user info
     */
    suspend fun verifyAndCreateAttendanceAnonymous(
        type: String,
        latitude: Double,
        longitude: Double,
        faceEmbedding: String
    ): Result<AttendanceResponse> {
        return try {
            Log.d(TAG, "Anonymous check-in: type=$type, lat=$latitude, lng=$longitude")
            Log.d(TAG, "Face embedding length: ${faceEmbedding.length}")

            val request = VerifyAttendanceRequest(
                type = type,
                latitude = latitude,
                longitude = longitude,
                faceEmbedding = faceEmbedding
            )

            val response = apiService.verifyAndCreateAttendanceAnonymous(request)

            Log.d(TAG, "Response code: ${response.code()}")
            Log.d(TAG, "Response message: ${response.message()}")

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✓ Anonymous attendance created successfully")
                Result.success(response.body()!!)
            } else {
                val errorBody = response.errorBody()?.string()
                val errorMsg = when (response.code()) {
                    401 -> {
                        if (errorBody?.contains("Face not recognized") == true) {
                            // Extract similarity percentage if available
                            val similarityMatch = Regex("Similarity: ([0-9.]+)%").find(errorBody)
                            val similarity = similarityMatch?.groupValues?.get(1) ?: "unknown"
                            "Wajah tidak dikenali (similarity: $similarity%). Pastikan wajah Anda sudah terdaftar dan disetujui admin."
                        } else {
                            "Verifikasi wajah gagal. Wajah tidak cocok dengan data yang terdaftar."
                        }
                    }
                    400 -> {
                        if (errorBody?.contains("already checked in") == true) {
                            "Anda sudah check-in hari ini."
                        } else if (errorBody?.contains("must check in before") == true) {
                            "Anda harus check-in terlebih dahulu sebelum check-out."
                        } else if (errorBody?.contains("already checked out") == true) {
                            "Anda sudah check-out hari ini."
                        } else if (errorBody?.contains("outside the allowed location") == true) {
                            "Anda berada di luar area yang diizinkan."
                        } else {
                            "Bad request: ${errorBody ?: "Unknown error"}"
                        }
                    }
                    404 -> {
                        if (errorBody?.contains("No approved users") == true) {
                            "Belum ada user yang terdaftar dan disetujui di sistem. Silakan registrasi terlebih dahulu."
                        } else {
                            "User tidak ditemukan."
                        }
                    }
                    500 -> "Server error. Silakan coba lagi nanti."
                    else -> "Error ${response.code()}: ${errorBody ?: response.message()}"
                }
                Log.e(TAG, "✗ Error: $errorMsg")
                Log.e(TAG, "Error body: $errorBody")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: ConnectException) {
            val msg = "Tidak dapat terhubung ke server.\n" +
                    "1. Pastikan backend running\n" +
                    "2. Cek koneksi internet\n" +
                    "3. Setup ADB reverse"
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: SocketTimeoutException) {
            val msg = "Request timeout. Server terlalu lama merespons."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: UnknownHostException) {
            val msg = "Cannot resolve host. Periksa BASE_URL di konfigurasi."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: Exception) {
            val msg = "Unexpected error: ${e.message}"
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        }
    }

    /**
     * Get today's attendance (check-in and check-out records)
     * @param token JWT authentication token
     * @return Result with list of AttendanceResponse
     */
    suspend fun getTodayAttendance(token: String): Result<List<AttendanceResponse>> {
        return try {
            Log.d(TAG, "Fetching today's attendance")

            val response = apiService.getTodayAttendance(token)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✓ Today's attendance fetched: ${response.body()!!.size} records")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error ${response.code()}: ${response.message()}"
                Log.e(TAG, "✗ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception fetching today's attendance", e)
            Result.failure(e)
        }
    }

    /**
     * Get user's attendance history
     * @param token JWT authentication token
     * @param startDate Start date (ISO format, optional)
     * @param endDate End date (ISO format, optional)
     * @return Result with list of AttendanceResponse
     */
    suspend fun getMyAttendances(
        token: String,
        startDate: String? = null,
        endDate: String? = null
    ): Result<List<AttendanceResponse>> {
        return try {
            Log.d(TAG, "Fetching attendance history")

            val response = apiService.getMyAttendances(token, startDate, endDate)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✓ Attendance history fetched: ${response.body()!!.size} records")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error ${response.code()}: ${response.message()}"
                Log.e(TAG, "✗ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception fetching attendance history", e)
            Result.failure(e)
        }
    }
}

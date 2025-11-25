package com.absensi.data.repository

import android.util.Log
import com.absensi.data.remote.api.RetrofitClient
import com.absensi.data.remote.dto.AttendanceResponse
import com.absensi.data.remote.dto.GroupedAttendanceResponse
import com.absensi.data.remote.dto.SyncEmbeddingsResponse
import com.absensi.data.remote.dto.VerifyAttendanceRequest
import com.absensi.data.remote.dto.VerifyDeviceRequest
import com.absensi.data.remote.dto.VerifyFaceOnlyRequest
import com.absensi.data.remote.dto.VerifyFaceOnlyResponse
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
     * Verify face and create attendance
     * @param token JWT authentication token (format: "Bearer <token>")
     * @param type "CHECK_IN" or "CHECK_OUT"
     * @param faceEmbedding JSON string of face embedding array
     * @return Result with AttendanceResponse or error
     */
    suspend fun verifyAndCreateAttendance(
        token: String,
        type: String,
        faceEmbedding: String
    ): Result<AttendanceResponse> {
        return try {
            Log.d(TAG, "Verifying and creating attendance: type=$type")
            Log.d(TAG, "Token: ${token.take(20)}...")
            Log.d(TAG, "Face embedding length: ${faceEmbedding.length}")

            val request = VerifyAttendanceRequest(
                type = type,
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
                            "Anda sudah melakukan Masuk hari ini."
                        } else if (errorBody?.contains("must check in before") == true) {
                            "Anda harus Masuk terlebih dahulu sebelum Pulang."
                        } else if (errorBody?.contains("already checked out") == true) {
                            "Anda sudah melakukan Pulang hari ini."
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
     * @param faceEmbedding JSON string of face embedding array
     * @return Result with AttendanceResponse including matched user info
     */
    suspend fun verifyAndCreateAttendanceAnonymous(
        type: String,
        faceEmbedding: String
    ): Result<AttendanceResponse> {
        return try {
            Log.d(TAG, "Anonymous check-in: type=$type")
            Log.d(TAG, "Face embedding length: ${faceEmbedding.length}")

            val request = VerifyAttendanceRequest(
                type = type,
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
                            "Anda sudah melakukan Masuk hari ini."
                        } else if (errorBody?.contains("must check in before") == true) {
                            "Anda harus Masuk terlebih dahulu sebelum Pulang."
                        } else if (errorBody?.contains("already checked out") == true) {
                            "Anda sudah melakukan Pulang hari ini."
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
     * Get ALL today's attendance (public - NO authentication required)
     * Returns grouped attendance per user (Masuk & Pulang combined)
     * @return Result with list of GroupedAttendanceResponse
     */
    suspend fun getTodayAllAttendance(): Result<List<GroupedAttendanceResponse>> {
        return try {
            Log.d(TAG, "Fetching all today's attendance (public)")

            val response = apiService.getTodayAllAttendance()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✓ All today's attendance fetched: ${response.body()!!.size} records")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error ${response.code()}: ${response.message()}"
                Log.e(TAG, "✗ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: ConnectException) {
            val msg = "Tidak dapat terhubung ke server."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: SocketTimeoutException) {
            val msg = "Request timeout."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: Exception) {
            Log.e(TAG, "Exception fetching all today's attendance", e)
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

    /**
     * Verify face only WITHOUT creating attendance
     * Used for early checkout confirmation flow
     * @param faceEmbedding Face image as base64 string
     * @return Result with VerifyFaceOnlyResponse including user info and schedule
     */
    suspend fun verifyFaceOnly(faceEmbedding: String): Result<VerifyFaceOnlyResponse> {
        return try {
            Log.d(TAG, "Verifying face only (no attendance creation)")
            Log.d(TAG, "Face embedding length: ${faceEmbedding.length}")

            val request = VerifyFaceOnlyRequest(faceEmbedding = faceEmbedding)
            val response = apiService.verifyFaceOnly(request)

            Log.d(TAG, "Response code: ${response.code()}")

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✓ Face verified: ${response.body()!!.userName}")
                Result.success(response.body()!!)
            } else {
                val errorBody = response.errorBody()?.string()
                val errorMsg = when (response.code()) {
                    401 -> "Wajah tidak dikenali. Pastikan wajah Anda sudah terdaftar dan disetujui admin."
                    404 -> "Tidak ada user yang terdaftar di sistem."
                    else -> "Error ${response.code()}: ${errorBody ?: response.message()}"
                }
                Log.e(TAG, "✗ Error: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: ConnectException) {
            val msg = "Tidak dapat terhubung ke server."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: SocketTimeoutException) {
            val msg = "Request timeout."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: Exception) {
            Log.e(TAG, "Exception verifying face", e)
            Result.failure(Exception("Unexpected error: ${e.message}"))
        }
    }

    /**
     * Sync embeddings from server for on-device face recognition
     * Downloads all approved user embeddings for MobileFaceNet verification
     * @return Result with SyncEmbeddingsResponse
     */
    suspend fun syncEmbeddings(): Result<SyncEmbeddingsResponse> {
        return try {
            Log.d(TAG, "Syncing embeddings from server...")

            val response = apiService.syncEmbeddings()

            Log.d(TAG, "Response code: ${response.code()}")

            if (response.isSuccessful && response.body() != null) {
                val data = response.body()!!
                Log.d(TAG, "✓ Synced ${data.count} embeddings")
                Result.success(data)
            } else {
                val errorBody = response.errorBody()?.string()
                val errorMsg = "Error ${response.code()}: ${errorBody ?: response.message()}"
                Log.e(TAG, "✗ Sync failed: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: ConnectException) {
            val msg = "Tidak dapat terhubung ke server untuk sync."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: SocketTimeoutException) {
            val msg = "Request timeout saat sync."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: Exception) {
            Log.e(TAG, "Exception syncing embeddings", e)
            Result.failure(Exception("Sync error: ${e.message}"))
        }
    }

    /**
     * Create attendance from device-verified face
     * Called when face is verified on-device using MobileFaceNet
     * @param odId User's ID (matched on device)
     * @param type "CHECK_IN" or "CHECK_OUT"
     * @param distance Face matching distance (lower = better)
     * @param similarity Similarity percentage (for display)
     * @return Result with AttendanceResponse
     */
    suspend fun createAttendanceFromDevice(
        odId: String,
        type: String,
        distance: Float,
        similarity: Float
    ): Result<AttendanceResponse> {
        return try {
            Log.d(TAG, "Creating attendance from device verification: user=$odId, type=$type, distance=$distance")

            val request = VerifyDeviceRequest(
                odId = odId,
                type = type,
                distance = distance,
                similarity = similarity
            )

            val response = apiService.verifyDevice(request)

            Log.d(TAG, "Response code: ${response.code()}")

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✓ Device-verified attendance created successfully")
                Result.success(response.body()!!)
            } else {
                val errorBody = response.errorBody()?.string()
                val errorMsg = when (response.code()) {
                    401 -> {
                        if (errorBody?.contains("inactive") == true) {
                            "Akun Anda tidak aktif. Silakan hubungi admin."
                        } else if (errorBody?.contains("not approved") == true) {
                            "Registrasi wajah belum disetujui."
                        } else {
                            "Verifikasi gagal."
                        }
                    }
                    400 -> {
                        if (errorBody?.contains("already checked in") == true) {
                            "Anda sudah melakukan Masuk hari ini."
                        } else if (errorBody?.contains("must check in before") == true) {
                            "Anda harus Masuk terlebih dahulu sebelum Pulang."
                        } else if (errorBody?.contains("already checked out") == true) {
                            "Anda sudah melakukan Pulang hari ini."
                        } else {
                            "Bad request: ${errorBody ?: "Unknown error"}"
                        }
                    }
                    404 -> "User tidak ditemukan."
                    500 -> "Server error. Silakan coba lagi nanti."
                    else -> "Error ${response.code()}: ${errorBody ?: response.message()}"
                }
                Log.e(TAG, "✗ Error: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: ConnectException) {
            val msg = "Tidak dapat terhubung ke server."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: SocketTimeoutException) {
            val msg = "Request timeout."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: Exception) {
            Log.e(TAG, "Exception creating device attendance", e)
            Result.failure(Exception("Unexpected error: ${e.message}"))
        }
    }
}

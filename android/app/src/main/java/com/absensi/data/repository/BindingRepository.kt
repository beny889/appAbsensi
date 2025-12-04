package com.absensi.data.repository

import android.util.Log
import com.absensi.data.remote.api.RetrofitClient
import com.absensi.data.remote.dto.*
import org.json.JSONObject
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

/**
 * Repository for device binding API operations
 */
class BindingRepository {

    private val apiService = RetrofitClient.apiService
    private val TAG = "BindingRepository"

    /**
     * Verify binding code is valid and available
     * @param code Binding code to verify (e.g., "ABCDE")
     * @return Result with verification response
     */
    suspend fun verifyBindingCode(code: String): Result<VerifyBindingResponse> {
        return try {
            Log.d(TAG, "Verifying binding code: $code")

            val response = apiService.verifyBindingCode(code)

            if (response.isSuccessful && response.body() != null) {
                val result = response.body()!!
                Log.d(TAG, "Verify result: valid=${result.valid}, branch=${result.branch?.name}")
                Result.success(result)
            } else {
                val errorBody = response.errorBody()?.string()
                val errorMsg = try {
                    if (errorBody != null) {
                        val json = JSONObject(errorBody)
                        json.optString("message", "Kode binding tidak valid")
                    } else {
                        "Kode binding tidak valid"
                    }
                } catch (e: Exception) {
                    "Kode binding tidak valid"
                }
                Log.e(TAG, "Verify failed: HTTP ${response.code()} - $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: ConnectException) {
            val msg = "Tidak dapat terhubung ke server. Periksa koneksi internet."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: SocketTimeoutException) {
            val msg = "Request timeout. Server tidak merespons."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: UnknownHostException) {
            val msg = "Tidak dapat menemukan server. Periksa koneksi internet."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: Exception) {
            val msg = "Error jaringan: ${e.message}"
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        }
    }

    /**
     * Use binding code to bind device
     * @param code Binding code
     * @param deviceName Device name/model
     * @return Result with use response
     */
    suspend fun useBindingCode(code: String, deviceName: String?): Result<UseBindingResponse> {
        return try {
            Log.d(TAG, "Using binding code: $code, device: $deviceName")

            val request = UseBindingRequest(code, deviceName)
            val response = apiService.useBindingCode(request)

            if (response.isSuccessful && response.body() != null) {
                val result = response.body()!!
                Log.d(TAG, "Use result: success=${result.success}, branch=${result.branch?.name}")
                Result.success(result)
            } else {
                val errorBody = response.errorBody()?.string()
                val errorMsg = try {
                    if (errorBody != null) {
                        val json = JSONObject(errorBody)
                        json.optString("message", "Gagal menggunakan kode binding")
                    } else {
                        "Gagal menggunakan kode binding"
                    }
                } catch (e: Exception) {
                    "Gagal menggunakan kode binding"
                }
                Log.e(TAG, "Use failed: HTTP ${response.code()} - $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: ConnectException) {
            val msg = "Tidak dapat terhubung ke server. Periksa koneksi internet."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: SocketTimeoutException) {
            val msg = "Request timeout. Server tidak merespons."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: UnknownHostException) {
            val msg = "Tidak dapat menemukan server. Periksa koneksi internet."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: Exception) {
            val msg = "Error jaringan: ${e.message}"
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        }
    }

    /**
     * Validate binding code is still active (for app startup)
     * @param code Binding code to validate
     * @return Result with validation response
     */
    suspend fun validateBindingCode(code: String): Result<ValidateBindingResponse> {
        return try {
            Log.d(TAG, "Validating binding code: $code")

            val request = ValidateBindingRequest(code)
            val response = apiService.validateBindingCode(request)

            if (response.isSuccessful && response.body() != null) {
                val result = response.body()!!
                Log.d(TAG, "Validate result: valid=${result.valid}")
                Result.success(result)
            } else {
                val errorBody = response.errorBody()?.string()
                val errorMsg = try {
                    if (errorBody != null) {
                        val json = JSONObject(errorBody)
                        json.optString("message", "Binding tidak valid")
                    } else {
                        "Binding tidak valid"
                    }
                } catch (e: Exception) {
                    "Binding tidak valid"
                }
                Log.e(TAG, "Validate failed: HTTP ${response.code()} - $errorMsg")
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
        } catch (e: UnknownHostException) {
            val msg = "Tidak dapat menemukan server."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: Exception) {
            val msg = "Error jaringan: ${e.message}"
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        }
    }
}

package com.absensi.data.repository

import android.util.Log
import com.absensi.data.remote.api.RetrofitClient
import com.absensi.data.remote.dto.BranchDto
import org.json.JSONObject
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

/**
 * Repository for branch-related API operations
 */
class BranchRepository {

    private val apiService = RetrofitClient.apiService
    private val TAG = "BranchRepository"

    /**
     * Fetch list of active branches from server
     * This is used for branch selection on first app launch
     * @return Result with list of branches or error message
     */
    suspend fun getActiveBranches(): Result<List<BranchDto>> {
        return try {
            Log.d(TAG, "Fetching active branches from server...")

            val response = apiService.getBranches()

            if (response.isSuccessful && response.body() != null) {
                val branches = response.body()!!
                Log.d(TAG, "Successfully fetched ${branches.size} branches")
                Result.success(branches)
            } else {
                val errorBody = response.errorBody()?.string()
                val errorMsg = try {
                    if (errorBody != null) {
                        val json = JSONObject(errorBody)
                        val message = json.optString("message", "")
                        if (message.isNotEmpty()) message else json.optString("error", errorBody)
                    } else {
                        "Gagal memuat daftar cabang"
                    }
                } catch (e: Exception) {
                    errorBody ?: "Gagal memuat daftar cabang"
                }
                Log.e(TAG, "Failed to fetch branches: HTTP ${response.code()} - $errorMsg")
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
     * Verify branch by code
     * @param code Branch code to verify (e.g., "JKT", "SBY")
     * @return Result with branch data or error message
     */
    suspend fun verifyBranchCode(code: String): Result<BranchDto> {
        return try {
            Log.d(TAG, "Verifying branch code: $code")

            val response = apiService.verifyBranchCode(code)

            if (response.isSuccessful && response.body() != null) {
                val branch = response.body()!!
                Log.d(TAG, "Branch verified: ${branch.name} (${branch.code})")
                Result.success(branch)
            } else {
                val errorBody = response.errorBody()?.string()
                val errorMsg = try {
                    if (errorBody != null) {
                        val json = JSONObject(errorBody)
                        json.optString("message", "Kode cabang tidak valid")
                    } else {
                        "Kode cabang tidak valid"
                    }
                } catch (e: Exception) {
                    "Kode cabang tidak valid"
                }
                Log.e(TAG, "Branch verification failed: HTTP ${response.code()} - $errorMsg")
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
}

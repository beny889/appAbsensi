package com.absensi.data.repository

import android.util.Log
import com.absensi.data.remote.api.RetrofitClient
import com.absensi.data.remote.dto.FaceRegistrationResponse
import com.absensi.data.remote.dto.SubmitFaceRegistrationRequest
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

class FaceRegistrationRepository {

    private val apiService = RetrofitClient.apiService
    private val TAG = "FaceRegistration"

    /**
     * Submit face registration to backend
     * @param name User's name
     * @param faceImageBase64 Base64 encoded face image
     * @return Result with FaceRegistrationResponse or error message
     */
    suspend fun submitRegistration(
        name: String,
        faceImageBase64: String
    ): Result<FaceRegistrationResponse> {
        return try {
            Log.d(TAG, "Submitting registration for: $name")
            Log.d(TAG, "Image size: ${faceImageBase64.length} characters")

            val request = SubmitFaceRegistrationRequest(
                name = name,
                faceImageBase64 = faceImageBase64
            )

            Log.d(TAG, "Sending request to API...")
            val response = apiService.submitFaceRegistration(request)
            Log.d(TAG, "Response code: ${response.code()}")

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "Registration successful: ${response.body()}")
                Result.success(response.body()!!)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Unknown error occurred"
                Log.e(TAG, "Registration failed: $errorMsg")
                Result.failure(Exception("Registration failed: $errorMsg"))
            }
        } catch (e: ConnectException) {
            val msg = "Cannot connect to server. Please check:\n1. Backend is running\n2. ADB reverse is set up\n3. Network connection"
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: SocketTimeoutException) {
            val msg = "Request timeout. Server is taking too long to respond."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: UnknownHostException) {
            val msg = "Cannot resolve host. Check backend URL configuration."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: Exception) {
            val msg = "Network error: ${e.javaClass.simpleName} - ${e.message}"
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        }
    }
}

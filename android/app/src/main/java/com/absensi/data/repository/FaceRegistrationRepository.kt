package com.absensi.data.repository

import android.util.Log
import com.absensi.data.remote.api.RetrofitClient
import com.absensi.data.remote.dto.FaceRegistrationResponse
import com.absensi.data.remote.dto.SubmitFaceRegistrationRequest
import org.json.JSONObject
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

class FaceRegistrationRepository {

    private val apiService = RetrofitClient.apiService
    private val TAG = "FaceRegistration"

    /**
     * Submit face registration to backend with pre-computed embedding
     * @param name User's name
     * @param faceEmbedding JSON string of face embedding (from MobileFaceNet)
     * @param faceImageBase64 Base64 encoded face image (for display in admin panel)
     * @return Result with FaceRegistrationResponse or error message
     */
    suspend fun submitRegistrationWithEmbedding(
        name: String,
        faceEmbedding: String,
        faceImageBase64: String
    ): Result<FaceRegistrationResponse> {
        return try {
            Log.d(TAG, "Submitting registration with embedding for: $name")
            Log.d(TAG, "Embedding: ${faceEmbedding.take(50)}...")

            val request = SubmitFaceRegistrationRequest(
                name = name,
                faceEmbedding = faceEmbedding,
                faceImageUrl = "data:image/jpeg;base64,$faceImageBase64"
            )

            Log.d(TAG, "Sending request to API...")
            val response = apiService.submitFaceRegistration(request)
            Log.d(TAG, "Response code: ${response.code()}")

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "Registration successful: ${response.body()}")
                Result.success(response.body()!!)
            } else {
                val errorBody = response.errorBody()?.string()
                val errorMsg = try {
                    if (errorBody != null) {
                        val json = JSONObject(errorBody)
                        val message = json.optString("message", "")
                        if (message.isNotEmpty()) message else json.optString("error", errorBody)
                    } else {
                        "Terjadi kesalahan yang tidak diketahui"
                    }
                } catch (e: Exception) {
                    errorBody ?: "Terjadi kesalahan yang tidak diketahui"
                }
                Log.e(TAG, "Registration failed: HTTP ${response.code()} - $errorMsg")
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
            val msg = "Cannot resolve host."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: Exception) {
            val msg = "Network error: ${e.message}"
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        }
    }

    /**
     * Submit face registration with MULTIPLE embeddings (5 angles for better accuracy)
     * @param name User's name
     * @param faceEmbeddings List of JSON embedding strings (5 embeddings from different angles)
     * @param faceImagesBase64 List of base64 encoded face images (5 images)
     * @return Result with FaceRegistrationResponse or error message
     */
    suspend fun submitRegistrationWithMultipleEmbeddings(
        name: String,
        faceEmbeddings: List<String>,
        faceImagesBase64: List<String>
    ): Result<FaceRegistrationResponse> {
        return try {
            Log.d(TAG, "Submitting multi-embedding registration for: $name")
            Log.d(TAG, "Number of embeddings: ${faceEmbeddings.size}")
            Log.d(TAG, "Number of images: ${faceImagesBase64.size}")

            // Convert base64 images to data URLs
            val imageUrls = faceImagesBase64.map { "data:image/jpeg;base64,$it" }

            val request = SubmitFaceRegistrationRequest(
                name = name,
                faceEmbeddings = faceEmbeddings,
                faceImagesBase64 = imageUrls,
                // Also send first image as primary for display
                faceImageUrl = imageUrls.firstOrNull()
            )

            Log.d(TAG, "Sending multi-embedding request to API...")
            val response = apiService.submitFaceRegistration(request)
            Log.d(TAG, "Response code: ${response.code()}")

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "Multi-embedding registration successful: ${response.body()}")
                Result.success(response.body()!!)
            } else {
                val errorBody = response.errorBody()?.string()
                val errorMsg = try {
                    if (errorBody != null) {
                        val json = JSONObject(errorBody)
                        val message = json.optString("message", "")
                        if (message.isNotEmpty()) message else json.optString("error", errorBody)
                    } else {
                        "Terjadi kesalahan yang tidak diketahui"
                    }
                } catch (e: Exception) {
                    errorBody ?: "Terjadi kesalahan yang tidak diketahui"
                }
                Log.e(TAG, "Multi-embedding registration failed: HTTP ${response.code()} - $errorMsg")
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
            val msg = "Cannot resolve host."
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        } catch (e: Exception) {
            val msg = "Network error: ${e.message}"
            Log.e(TAG, msg, e)
            Result.failure(Exception(msg))
        }
    }

    /**
     * Submit face registration to backend (legacy - server extracts embedding)
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
                val errorBody = response.errorBody()?.string()
                val errorMsg = try {
                    if (errorBody != null) {
                        val json = JSONObject(errorBody)
                        // Extract "message" field from NestJS error response
                        // Format: {"statusCode":400,"message":"...","error":"Bad Request"}
                        val message = json.optString("message", "")
                        if (message.isNotEmpty()) {
                            message
                        } else {
                            json.optString("error", errorBody)
                        }
                    } else {
                        "Terjadi kesalahan yang tidak diketahui"
                    }
                } catch (e: Exception) {
                    errorBody ?: "Terjadi kesalahan yang tidak diketahui"
                }
                Log.e(TAG, "Registration failed: HTTP ${response.code()} - $errorMsg")
                Result.failure(Exception(errorMsg))
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

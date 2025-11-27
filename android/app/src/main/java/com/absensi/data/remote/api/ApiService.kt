package com.absensi.data.remote.api

import com.absensi.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    /**
     * Submit face registration (public endpoint - no auth required)
     */
    @POST("face-registration/submit")
    suspend fun submitFaceRegistration(
        @Body request: SubmitFaceRegistrationRequest
    ): Response<FaceRegistrationResponse>

    /**
     * Verify face and location, then create attendance (CHECK_IN or CHECK_OUT)
     * Requires JWT authentication
     */
    @POST("attendance/verify")
    suspend fun verifyAndCreateAttendance(
        @Header("Authorization") token: String,
        @Body request: VerifyAttendanceRequest
    ): Response<AttendanceResponse>

    /**
     * Anonymous check-in/check-out (NO authentication required)
     * Uses face recognition to identify user automatically
     */
    @POST("attendance/verify-anonymous")
    suspend fun verifyAndCreateAttendanceAnonymous(
        @Body request: VerifyAttendanceRequest
    ): Response<AttendanceResponse>

    /**
     * Verify face only WITHOUT creating attendance
     * Used for early checkout confirmation flow
     */
    @POST("attendance/verify-only")
    suspend fun verifyFaceOnly(
        @Body request: VerifyFaceOnlyRequest
    ): Response<VerifyFaceOnlyResponse>

    /**
     * Get today's attendance (check-in and check-out)
     * Requires JWT authentication
     */
    @GET("attendance/today")
    suspend fun getTodayAttendance(
        @Header("Authorization") token: String
    ): Response<List<AttendanceResponse>>

    /**
     * Get ALL today's attendance (public - NO authentication required)
     * Returns grouped attendance per user (Masuk & Pulang combined)
     */
    @GET("attendance/today-all")
    suspend fun getTodayAllAttendance(): Response<List<GroupedAttendanceResponse>>

    /**
     * Get user's attendance history
     * Requires JWT authentication
     */
    @GET("attendance/my")
    suspend fun getMyAttendances(
        @Header("Authorization") token: String,
        @Query("startDate") startDate: String?,
        @Query("endDate") endDate: String?
    ): Response<List<AttendanceResponse>>

    /**
     * Login endpoint
     */
    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    /**
     * Sync embeddings for on-device face recognition (NO authentication required)
     * Returns all approved user embeddings for MobileFaceNet verification
     */
    @GET("attendance/sync-embeddings")
    suspend fun syncEmbeddings(): Response<SyncEmbeddingsResponse>

    /**
     * Create attendance from device-verified face (NO authentication required)
     * Called when Android verifies face on-device using MobileFaceNet
     */
    @POST("attendance/verify-device")
    suspend fun verifyDevice(
        @Body request: VerifyDeviceRequest
    ): Response<AttendanceResponse>

    /**
     * Log face match attempt (NO authentication required)
     * Logs every face matching attempt for debugging purposes
     */
    @POST("attendance/log-attempt")
    suspend fun logAttempt(
        @Body request: LogAttemptRequest
    ): Response<LogAttemptResponse>

    /**
     * Get user's work schedule by userId (NO authentication required)
     * Used for early checkout confirmation flow
     */
    @GET("attendance/schedule/{userId}")
    suspend fun getUserSchedule(
        @Path("userId") userId: String
    ): Response<UserScheduleResponse>
}

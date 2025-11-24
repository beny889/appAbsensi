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
     * Get today's attendance (check-in and check-out)
     * Requires JWT authentication
     */
    @GET("attendance/today")
    suspend fun getTodayAttendance(
        @Header("Authorization") token: String
    ): Response<List<AttendanceResponse>>

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
}

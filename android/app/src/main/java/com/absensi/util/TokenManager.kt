package com.absensi.util

import android.content.Context
import android.content.SharedPreferences

/**
 * Manages JWT authentication token storage using SharedPreferences
 */
class TokenManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(
        PREFS_NAME,
        Context.MODE_PRIVATE
    )

    companion object {
        private const val PREFS_NAME = "absensi_prefs"
        private const val KEY_TOKEN = "jwt_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_EMAIL = "user_email"

        // For demo purposes - hardcoded test user token
        // TODO: Remove this when proper login is implemented
        const val DEMO_TOKEN = "demo_token_replace_with_real_login"
    }

    /**
     * Save JWT token
     */
    fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    /**
     * Get JWT token
     * @return Token with "Bearer " prefix, or null if not logged in
     */
    fun getToken(): String? {
        val token = prefs.getString(KEY_TOKEN, null)
        return if (token != null) "Bearer $token" else null
    }

    /**
     * Check if user is logged in
     */
    fun isLoggedIn(): Boolean {
        return prefs.contains(KEY_TOKEN)
    }

    /**
     * Save user info
     */
    fun saveUserInfo(userId: String, userName: String, userEmail: String) {
        prefs.edit().apply {
            putString(KEY_USER_ID, userId)
            putString(KEY_USER_NAME, userName)
            putString(KEY_USER_EMAIL, userEmail)
            apply()
        }
    }

    /**
     * Get user ID
     */
    fun getUserId(): String? {
        return prefs.getString(KEY_USER_ID, null)
    }

    /**
     * Get user name
     */
    fun getUserName(): String? {
        return prefs.getString(KEY_USER_NAME, null)
    }

    /**
     * Get user email
     */
    fun getUserEmail(): String? {
        return prefs.getString(KEY_USER_EMAIL, null)
    }

    /**
     * Clear all stored data (logout)
     */
    fun clearToken() {
        prefs.edit().clear().apply()
    }

    /**
     * For demo/testing purposes - auto-login with test user
     * This creates a test user token that can be used for development
     * TODO: Remove this when proper authentication is implemented
     */
    fun setupDemoUser(token: String, userId: String, name: String, email: String) {
        saveToken(token)
        saveUserInfo(userId, name, email)
    }
}

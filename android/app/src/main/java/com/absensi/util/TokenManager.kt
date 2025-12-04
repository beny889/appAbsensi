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

        // Branch selection keys
        private const val KEY_BRANCH_ID = "branch_id"
        private const val KEY_BRANCH_NAME = "branch_name"
        private const val KEY_BRANCH_CODE = "branch_code"
        private const val KEY_BRANCH_SELECTED = "branch_selected"

        // Device binding keys
        private const val KEY_BINDING_ID = "binding_id"
        private const val KEY_BINDING_CODE = "binding_code"
        private const val KEY_DEVICE_BOUND = "device_bound"

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

    // ============= Branch Selection Methods =============

    /**
     * Save branch selection (called on first launch)
     * This selection is permanent until app is reinstalled
     */
    fun saveBranchSelection(branchId: String, branchName: String, branchCode: String) {
        prefs.edit().apply {
            putString(KEY_BRANCH_ID, branchId)
            putString(KEY_BRANCH_NAME, branchName)
            putString(KEY_BRANCH_CODE, branchCode)
            putBoolean(KEY_BRANCH_SELECTED, true)
            apply()
        }
    }

    /**
     * Check if branch has been selected
     * Used to determine if first-launch branch selection screen should be shown
     */
    fun isBranchSelected(): Boolean {
        return prefs.getBoolean(KEY_BRANCH_SELECTED, false)
    }

    /**
     * Get selected branch ID
     * @return Branch ID or null if not selected
     */
    fun getBranchId(): String? {
        return prefs.getString(KEY_BRANCH_ID, null)
    }

    /**
     * Get selected branch name
     * @return Branch name or null if not selected
     */
    fun getBranchName(): String? {
        return prefs.getString(KEY_BRANCH_NAME, null)
    }

    /**
     * Get selected branch code
     * @return Branch code (e.g., "JKT", "SBY") or null if not selected
     */
    fun getBranchCode(): String? {
        return prefs.getString(KEY_BRANCH_CODE, null)
    }

    /**
     * Clear branch selection (for testing purposes only)
     * Note: In production, branch selection should only be cleared by reinstalling the app
     */
    fun clearBranchSelection() {
        prefs.edit().apply {
            remove(KEY_BRANCH_ID)
            remove(KEY_BRANCH_NAME)
            remove(KEY_BRANCH_CODE)
            remove(KEY_BRANCH_SELECTED)
            apply()
        }
    }

    // ============= Device Binding Methods =============

    /**
     * Save binding code when device is bound to a branch
     * @param bindingId The binding record ID
     * @param bindingCode The 5-character binding code (e.g., "ABCDE")
     * @param branchId The branch ID
     * @param branchName The branch name
     * @param branchCode The branch code (e.g., "JKT")
     */
    fun saveBindingCode(
        bindingId: String,
        bindingCode: String,
        branchId: String,
        branchName: String,
        branchCode: String
    ) {
        prefs.edit().apply {
            putString(KEY_BINDING_ID, bindingId)
            putString(KEY_BINDING_CODE, bindingCode)
            putString(KEY_BRANCH_ID, branchId)
            putString(KEY_BRANCH_NAME, branchName)
            putString(KEY_BRANCH_CODE, branchCode)
            putBoolean(KEY_DEVICE_BOUND, true)
            putBoolean(KEY_BRANCH_SELECTED, true) // For backward compatibility
            apply()
        }
    }

    /**
     * Check if device is bound to a branch
     * @return true if device has been bound with a binding code
     */
    fun isDeviceBound(): Boolean {
        return prefs.getBoolean(KEY_DEVICE_BOUND, false)
    }

    /**
     * Get the binding code
     * @return The 5-character binding code or null if not bound
     */
    fun getBindingCode(): String? {
        return prefs.getString(KEY_BINDING_CODE, null)
    }

    /**
     * Get the binding ID
     * @return The binding record ID or null if not bound
     */
    fun getBindingId(): String? {
        return prefs.getString(KEY_BINDING_ID, null)
    }

    /**
     * Clear binding (for testing or when binding is revoked)
     */
    fun clearBinding() {
        prefs.edit().apply {
            remove(KEY_BINDING_ID)
            remove(KEY_BINDING_CODE)
            remove(KEY_BRANCH_ID)
            remove(KEY_BRANCH_NAME)
            remove(KEY_BRANCH_CODE)
            remove(KEY_DEVICE_BOUND)
            remove(KEY_BRANCH_SELECTED)
            apply()
        }
    }
}

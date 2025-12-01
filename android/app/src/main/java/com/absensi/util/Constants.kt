package com.absensi.util

object Constants {
    // Network - Production URL
    const val BASE_URL = "https://absen.bravenozora.com/api/"
    const val CONNECT_TIMEOUT = 30L
    const val READ_TIMEOUT = 30L
    const val WRITE_TIMEOUT = 30L

    // Preferences
    const val PREF_NAME = "absensi_prefs"
    const val KEY_TOKEN = "auth_token"
    const val KEY_USER_ID = "user_id"
    const val KEY_USER_EMAIL = "user_email"
    const val KEY_USER_NAME = "user_name"
    const val KEY_USER_ROLE = "user_role"

    // Face Detection
    const val FACE_SIMILARITY_THRESHOLD = 0.6f
    const val MIN_FACE_SIZE = 0.15f
    const val FACE_EMBEDDING_SIZE = 128

    // Request Codes
    const val REQUEST_CAMERA_PERMISSION = 100

    // Database
    const val DATABASE_NAME = "absensi_db"
    const val DATABASE_VERSION = 1
}

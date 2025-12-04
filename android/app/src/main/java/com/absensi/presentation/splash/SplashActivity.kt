package com.absensi.presentation.splash

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.absensi.data.repository.BindingRepository
import com.absensi.presentation.branch.BranchSelectionActivity
import com.absensi.presentation.branch.BindingErrorActivity
import com.absensi.presentation.main.MainActivity
import com.absensi.util.TokenManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

class SplashActivity : AppCompatActivity() {

    private val TAG = "SplashActivity"
    private lateinit var tokenManager: TokenManager
    private lateinit var bindingRepository: BindingRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        tokenManager = TokenManager(this)
        bindingRepository = BindingRepository()

        Handler(Looper.getMainLooper()).postDelayed({
            checkBindingStatus()
        }, 1500) // 1.5 second delay
    }

    private fun checkBindingStatus() {
        // Check if device is bound
        if (!tokenManager.isDeviceBound()) {
            // First launch - show binding code input screen
            Log.d(TAG, "Device not bound, showing BranchSelectionActivity")
            navigateTo(BranchSelectionActivity::class.java)
            return
        }

        // Device is bound, validate binding is still active
        val bindingCode = tokenManager.getBindingCode()
        if (bindingCode.isNullOrEmpty()) {
            // Binding code missing, need to rebind
            Log.w(TAG, "Binding code missing, clearing binding and showing selection")
            tokenManager.clearBinding()
            navigateTo(BranchSelectionActivity::class.java)
            return
        }

        Log.d(TAG, "Validating binding code: $bindingCode")

        CoroutineScope(Dispatchers.Main).launch {
            val result = withContext(Dispatchers.IO) {
                bindingRepository.validateBindingCode(bindingCode)
            }

            result.fold(
                onSuccess = { response ->
                    if (response.valid) {
                        // Binding is still active, proceed to main
                        Log.d(TAG, "Binding valid, proceeding to MainActivity")
                        navigateTo(MainActivity::class.java)
                    } else {
                        // Binding has been disabled by admin
                        Log.w(TAG, "Binding disabled: ${response.message}")
                        navigateToBindingError(response.message ?: "Binding telah dinonaktifkan")
                    }
                },
                onFailure = { error ->
                    // Check if it's a network error
                    when (error) {
                        is ConnectException, is SocketTimeoutException, is UnknownHostException -> {
                            // Network error - allow offline access
                            Log.w(TAG, "Network error during validation, allowing offline access")
                            navigateTo(MainActivity::class.java)
                        }
                        else -> {
                            // Server rejected binding (invalid/disabled)
                            Log.e(TAG, "Binding validation failed: ${error.message}")
                            navigateToBindingError(error.message ?: "Binding tidak valid")
                        }
                    }
                }
            )
        }
    }

    private fun navigateTo(activityClass: Class<*>) {
        startActivity(Intent(this, activityClass))
        finish()
    }

    private fun navigateToBindingError(message: String) {
        val intent = Intent(this, BindingErrorActivity::class.java).apply {
            putExtra(BindingErrorActivity.EXTRA_ERROR_MESSAGE, message)
        }
        startActivity(intent)
        finish()
    }
}

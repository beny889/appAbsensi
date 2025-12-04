package com.absensi.presentation.branch

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.absensi.R
import com.absensi.data.repository.BindingRepository
import com.absensi.presentation.main.MainActivity
import com.absensi.util.TokenManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Activity shown when device binding has been disabled by admin
 * User cannot proceed until admin re-enables the binding
 * Or user can enter a new binding code
 */
class BindingErrorActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_ERROR_MESSAGE = "error_message"
    }

    private lateinit var textErrorMessage: TextView
    private lateinit var buttonRetry: Button
    private lateinit var buttonNewCode: Button
    private lateinit var progressBar: ProgressBar

    private lateinit var tokenManager: TokenManager
    private lateinit var bindingRepository: BindingRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_binding_error)

        tokenManager = TokenManager(this)
        bindingRepository = BindingRepository()

        // Bind views
        textErrorMessage = findViewById(R.id.textErrorMessage)
        buttonRetry = findViewById(R.id.buttonRetry)
        buttonNewCode = findViewById(R.id.buttonNewCode)
        progressBar = findViewById(R.id.progressBar)

        // Get error message from intent
        val errorMessage = intent.getStringExtra(EXTRA_ERROR_MESSAGE)
            ?: "Binding perangkat telah dinonaktifkan"
        textErrorMessage.text = errorMessage

        // Setup listeners
        buttonRetry.setOnClickListener {
            retryValidation()
        }

        buttonNewCode.setOnClickListener {
            // Clear current binding and go to binding input screen
            tokenManager.clearBinding()
            startActivity(Intent(this, BranchSelectionActivity::class.java))
            finish()
        }
    }

    private fun retryValidation() {
        val bindingCode = tokenManager.getBindingCode()
        if (bindingCode.isNullOrEmpty()) {
            // No binding code, go to selection
            tokenManager.clearBinding()
            startActivity(Intent(this, BranchSelectionActivity::class.java))
            finish()
            return
        }

        showLoading()

        CoroutineScope(Dispatchers.Main).launch {
            val result = withContext(Dispatchers.IO) {
                bindingRepository.validateBindingCode(bindingCode)
            }

            hideLoading()

            result.fold(
                onSuccess = { response ->
                    if (response.valid) {
                        // Binding is now active again
                        Toast.makeText(
                            this@BindingErrorActivity,
                            "Binding aktif kembali!",
                            Toast.LENGTH_SHORT
                        ).show()
                        startActivity(Intent(this@BindingErrorActivity, MainActivity::class.java))
                        finish()
                    } else {
                        textErrorMessage.text = response.message
                            ?: "Binding masih dinonaktifkan"
                    }
                },
                onFailure = { error ->
                    textErrorMessage.text = error.message
                        ?: "Gagal memeriksa status binding"
                }
            )
        }
    }

    private fun showLoading() {
        progressBar.visibility = View.VISIBLE
        buttonRetry.isEnabled = false
        buttonNewCode.isEnabled = false
    }

    private fun hideLoading() {
        progressBar.visibility = View.GONE
        buttonRetry.isEnabled = true
        buttonNewCode.isEnabled = true
    }

    // Disable back button on this screen
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Don't allow going back - user must resolve binding issue
        Toast.makeText(
            this,
            "Hubungi administrator untuk mengaktifkan binding",
            Toast.LENGTH_SHORT
        ).show()
    }
}

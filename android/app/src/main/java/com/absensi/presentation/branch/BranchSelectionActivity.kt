package com.absensi.presentation.branch

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import com.absensi.R
import com.absensi.data.remote.dto.VerifyBindingResponse
import com.absensi.data.repository.BindingRepository
import com.absensi.presentation.main.MainActivity
import com.absensi.util.TokenManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Activity for entering binding code on first app launch
 * User must enter a valid binding code to bind device to a branch
 * This selection is mandatory and permanent until binding is revoked by admin
 */
class BranchSelectionActivity : AppCompatActivity() {

    private lateinit var editTextBindingCode: EditText
    private lateinit var buttonVerify: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var textError: TextView
    private lateinit var cardBranchInfo: CardView
    private lateinit var textBranchName: TextView
    private lateinit var textBranchCity: TextView
    private lateinit var buttonConfirm: Button

    private lateinit var bindingRepository: BindingRepository
    private lateinit var tokenManager: TokenManager

    private var verifiedResponse: VerifyBindingResponse? = null
    private var inputCode: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_branch_selection)

        // Initialize
        bindingRepository = BindingRepository()
        tokenManager = TokenManager(this)

        // Bind views
        editTextBindingCode = findViewById(R.id.editTextBranchCode)
        buttonVerify = findViewById(R.id.buttonVerify)
        progressBar = findViewById(R.id.progressBar)
        textError = findViewById(R.id.textError)
        cardBranchInfo = findViewById(R.id.cardBranchInfo)
        textBranchName = findViewById(R.id.textBranchName)
        textBranchCity = findViewById(R.id.textBranchCity)
        buttonConfirm = findViewById(R.id.buttonConfirm)

        // Update UI text for binding code
        findViewById<TextView>(R.id.textTitle)?.text = "Masukkan Kode Binding"
        findViewById<TextView>(R.id.textSubtitle)?.text =
            "Masukkan kode binding yang diberikan oleh administrator.\nPilihan ini tidak dapat diubah setelah dipilih."
        editTextBindingCode.hint = "Contoh: ABCDE"

        // Setup listeners
        buttonVerify.setOnClickListener {
            verifyBindingCode()
        }

        buttonConfirm.setOnClickListener {
            confirmBindingSelection()
        }

        // Handle keyboard done action
        editTextBindingCode.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                verifyBindingCode()
                true
            } else {
                false
            }
        }

        // Clear error when user types
        editTextBindingCode.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                hideError()
                hideBranchInfo()
            }
        }
    }

    private fun verifyBindingCode() {
        val code = editTextBindingCode.text.toString().trim().uppercase()

        if (code.isEmpty()) {
            showError("Masukkan kode binding")
            return
        }

        if (code.length != 5) {
            showError("Kode binding harus 5 karakter")
            return
        }

        inputCode = code

        // Hide keyboard
        hideKeyboard()

        // Show loading
        showLoading()
        hideError()
        hideBranchInfo()

        CoroutineScope(Dispatchers.Main).launch {
            val result = withContext(Dispatchers.IO) {
                bindingRepository.verifyBindingCode(code)
            }

            hideLoading()

            result.fold(
                onSuccess = { response ->
                    if (response.valid && response.branch != null) {
                        verifiedResponse = response
                        showBranchInfo(response)
                    } else {
                        showError(response.message ?: "Kode binding tidak valid")
                    }
                },
                onFailure = { error ->
                    showError(error.message ?: "Kode binding tidak valid")
                }
            )
        }
    }

    private fun confirmBindingSelection() {
        val response = verifiedResponse ?: return
        val branch = response.branch ?: return

        // Show confirmation dialog
        AlertDialog.Builder(this)
            .setTitle("Konfirmasi Binding")
            .setMessage(
                "Binding perangkat ke \"${branch.name}\"?\n\n" +
                "Catatan: Pilihan ini TIDAK dapat diubah oleh pengguna. " +
                "Hanya administrator yang dapat menonaktifkan binding ini."
            )
            .setPositiveButton("Ya, Binding") { _, _ ->
                useBindingCode()
            }
            .setNegativeButton("Batal", null)
            .show()
    }

    private fun useBindingCode() {
        val deviceName = "${Build.MANUFACTURER} ${Build.MODEL}"

        showLoading()

        CoroutineScope(Dispatchers.Main).launch {
            val result = withContext(Dispatchers.IO) {
                bindingRepository.useBindingCode(inputCode, deviceName)
            }

            hideLoading()

            result.fold(
                onSuccess = { response ->
                    if (response.success && response.binding != null && response.branch != null) {
                        // Save binding to TokenManager
                        tokenManager.saveBindingCode(
                            response.binding.id,
                            response.binding.code,
                            response.branch.id,
                            response.branch.name,
                            response.branch.code
                        )

                        // Show confirmation
                        Toast.makeText(
                            this@BranchSelectionActivity,
                            "Perangkat berhasil di-binding ke ${response.branch.name}",
                            Toast.LENGTH_SHORT
                        ).show()

                        // Navigate to MainActivity
                        startActivity(Intent(this@BranchSelectionActivity, MainActivity::class.java))
                        finish()
                    } else {
                        showError(response.message ?: "Gagal menggunakan kode binding")
                    }
                },
                onFailure = { error ->
                    showError(error.message ?: "Terjadi kesalahan")
                }
            )
        }
    }

    private fun showLoading() {
        progressBar.visibility = View.VISIBLE
        buttonVerify.isEnabled = false
        buttonConfirm.isEnabled = false
    }

    private fun hideLoading() {
        progressBar.visibility = View.GONE
        buttonVerify.isEnabled = true
        buttonConfirm.isEnabled = true
    }

    private fun showError(message: String) {
        textError.text = message
        textError.visibility = View.VISIBLE
    }

    private fun hideError() {
        textError.visibility = View.GONE
    }

    private fun showBranchInfo(response: VerifyBindingResponse) {
        val branch = response.branch ?: return
        textBranchName.text = branch.name
        textBranchCity.text = branch.city ?: "Kode: ${branch.code}"
        cardBranchInfo.visibility = View.VISIBLE
    }

    private fun hideBranchInfo() {
        cardBranchInfo.visibility = View.GONE
        verifiedResponse = null
    }

    private fun hideKeyboard() {
        val imm = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
        currentFocus?.let {
            imm.hideSoftInputFromWindow(it.windowToken, 0)
        }
    }

    // Disable back button on this screen
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Don't allow going back - binding is mandatory
        Toast.makeText(
            this,
            "Silakan masukkan kode binding untuk melanjutkan",
            Toast.LENGTH_SHORT
        ).show()
    }
}

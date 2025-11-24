package com.absensi.presentation.camera

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.os.Bundle
import android.util.Log
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.absensi.databinding.ActivityCameraBinding
import com.absensi.data.repository.AttendanceRepository
import com.absensi.data.repository.FaceRegistrationRepository
import com.absensi.util.Constants
import com.absensi.util.ImageUtils
import com.absensi.util.TokenManager
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.math.sqrt

class CameraActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCameraBinding
    private var imageCapture: ImageCapture? = null
    private var camera: Camera? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private lateinit var cameraExecutor: ExecutorService

    private var isCheckIn: Boolean = true
    private var isFaceDetected = false
    private var isProcessing = false
    private var activityMode: String = MODE_ATTENDANCE
    private var userName: String = ""  // Store user name for registration

    // Repositories
    private val registrationRepository = FaceRegistrationRepository()
    private val attendanceRepository = AttendanceRepository()

    // Token manager for authentication
    private lateinit var tokenManager: TokenManager

    // ML Kit Face Detector - Increased sensitivity for better accuracy
    private val faceDetectorOptions = FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
        .setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE)
        .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
        .setMinFaceSize(0.35f)  // Increased from 0.15f - face must be closer
        .build()

    private val faceDetector = FaceDetection.getClient(faceDetectorOptions)

    // Face validation state
    private var stableFrameCount = 0
    private var lastFaceBounds: android.graphics.RectF? = null
    private var countdownValue = 3
    private var isCountingDown = false

    companion object {
        const val EXTRA_IS_CHECK_IN = "extra_is_check_in"
        const val EXTRA_MODE = "extra_mode"
        const val MODE_ATTENDANCE = "mode_attendance"
        const val MODE_REGISTRATION = "mode_registration"
        private const val TAG = "CameraActivity"

        // Face validation constants
        private const val MIN_FACE_SIZE_RATIO = 0.40f      // Face must be 40% of frame
        private const val FACE_CENTER_TOLERANCE = 0.20f    // ±20% from center
        private const val STABILITY_FRAMES = 15             // 15 frames (~1.5s)
        private const val COUNTDOWN_SECONDS = 3
        private const val FACE_BOUNDS_SIMILARITY_THRESHOLD = 0.05f  // 5% movement tolerance
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCameraBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize TokenManager
        tokenManager = TokenManager(this)

        // Get mode from intent
        activityMode = intent.getStringExtra(EXTRA_MODE) ?: MODE_ATTENDANCE
        isCheckIn = intent.getBooleanExtra(EXTRA_IS_CHECK_IN, true)

        updateTitle()

        cameraExecutor = Executors.newSingleThreadExecutor()

        setupListeners()

        // For REGISTRATION mode, ask for name FIRST before starting camera
        if (activityMode == MODE_REGISTRATION) {
            showNameInputDialog()  // Show name dialog immediately
        } else {
            // For attendance mode, directly start camera
            if (checkPermissions()) {
                startCamera()
            } else {
                requestPermissions()
            }
        }
    }

    private fun updateTitle() {
        binding.tvTitle.text = when (activityMode) {
            MODE_REGISTRATION -> {
                if (userName.isEmpty()) {
                    "📝 Registrasi Wajah - Input Nama"
                } else {
                    "📸 Rekam Wajah - $userName"
                }
            }
            else -> if (isCheckIn) "Scan Wajah untuk Check In" else "Scan Wajah untuk Check Out"
        }
    }

    private fun setupListeners() {
        binding.btnCancel.setOnClickListener {
            finish()
        }
    }

    private fun checkPermissions(): Boolean {
        val cameraGranted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED

        val locationGranted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        return cameraGranted && locationGranted
    }

    private fun requestPermissions() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(
                Manifest.permission.CAMERA,
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ),
            Constants.REQUEST_CAMERA_PERMISSION
        )
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == Constants.REQUEST_CAMERA_PERMISSION) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startCamera()
            } else {
                Toast.makeText(
                    this,
                    "Izin kamera diperlukan untuk menggunakan fitur ini",
                    Toast.LENGTH_SHORT
                ).show()
                finish()
            }
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()

            // Preview
            val preview = Preview.Builder()
                .build()
                .also {
                    it.setSurfaceProvider(binding.previewView.surfaceProvider)
                }

            // Image capture
            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                .build()

            // Image analysis for face detection
            val imageAnalyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(cameraExecutor) { imageProxy ->
                        processImageProxy(imageProxy)
                    }
                }

            // Select front camera
            val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

            try {
                // Unbind use cases before rebinding
                cameraProvider?.unbindAll()

                // Bind use cases to camera
                camera = cameraProvider?.bindToLifecycle(
                    this,
                    cameraSelector,
                    preview,
                    imageCapture,
                    imageAnalyzer
                )

            } catch (exc: Exception) {
                Log.e(TAG, "Use case binding failed", exc)
                Toast.makeText(
                    this,
                    "Gagal membuka kamera",
                    Toast.LENGTH_SHORT
                ).show()
                finish()
            }

        }, ContextCompat.getMainExecutor(this))
    }

    @androidx.camera.core.ExperimentalGetImage
    private fun processImageProxy(imageProxy: ImageProxy) {
        if (isProcessing) {
            imageProxy.close()
            return
        }

        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            val image = InputImage.fromMediaImage(
                mediaImage,
                imageProxy.imageInfo.rotationDegrees
            )

            faceDetector.process(image)
                .addOnSuccessListener { faces ->
                    if (faces.isNotEmpty()) {
                        val face = faces[0]  // Take first detected face
                        val imageWidth = mediaImage.width
                        val imageHeight = mediaImage.height

                        // Validate face size
                        if (!isFaceLargeEnough(face, imageWidth, imageHeight)) {
                            runOnUiThread {
                                updateStatus("⚠️ Wajah terlalu jauh, dekati kamera")
                            }
                            // Reset counters
                            stableFrameCount = 0
                            lastFaceBounds = null
                            isFaceDetected = false
                            return@addOnSuccessListener
                        }

                        // Validate face position
                        if (!isFaceInValidPosition(face, imageWidth, imageHeight)) {
                            runOnUiThread {
                                updateStatus("⚠️ Posisikan wajah di tengah lingkaran")
                            }
                            // Reset counters
                            stableFrameCount = 0
                            lastFaceBounds = null
                            isFaceDetected = false
                            return@addOnSuccessListener
                        }

                        // Check face stability
                        val currentBounds = android.graphics.RectF(face.boundingBox)

                        if (areFaceBoundsSimilar(currentBounds, lastFaceBounds)) {
                            stableFrameCount++
                            runOnUiThread {
                                val progress = (stableFrameCount * 100) / STABILITY_FRAMES
                                updateStatus("✓ Posisi bagus! Tahan... ($progress%)")
                            }
                        } else {
                            stableFrameCount = 1  // Reset but count current frame
                            runOnUiThread {
                                updateStatus("✓ Posisi bagus! Tahan posisi...")
                            }
                        }

                        lastFaceBounds = currentBounds

                        // If face is stable for required frames, start countdown and capture
                        if (stableFrameCount >= STABILITY_FRAMES && !isFaceDetected && !isCountingDown) {
                            isFaceDetected = true

                            // For registration mode, convert image to base64 BEFORE countdown
                            if (activityMode == MODE_REGISTRATION) {
                                try {
                                    val faceImageBase64 = ImageUtils.imageProxyToBase64(imageProxy)
                                    runOnUiThread {
                                        startCaptureCountdown {
                                            // Use pre-captured image
                                            processRegistration(faceImageBase64)
                                        }
                                    }
                                } catch (e: Exception) {
                                    Log.e(TAG, "Error converting image", e)
                                    runOnUiThread {
                                        Toast.makeText(
                                            this,
                                            "Gagal memproses gambar: ${e.message}",
                                            Toast.LENGTH_SHORT
                                        ).show()
                                        isProcessing = false
                                        isFaceDetected = false
                                        stableFrameCount = 0
                                    }
                                }
                            } else {
                                // For attendance mode, just start countdown
                                runOnUiThread {
                                    startCaptureCountdown {
                                        processAttendance()
                                    }
                                }
                            }
                        }
                    } else {
                        // No face detected - reset all
                        if (isFaceDetected || stableFrameCount > 0) {
                            stableFrameCount = 0
                            lastFaceBounds = null
                            isFaceDetected = false
                        }
                        runOnUiThread {
                            if (!isProcessing && !isCountingDown) {
                                updateStatus("👤 Mencari wajah...")
                            }
                        }
                    }
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Face detection failed", e)
                    runOnUiThread {
                        updateStatus("❌ Deteksi gagal, coba lagi")
                    }
                }
                .addOnCompleteListener {
                    imageProxy.close()
                }
        } else {
            imageProxy.close()
        }
    }

    private fun updateStatus(message: String) {
        binding.tvStatus.text = message
    }

    /**
     * Check if detected face is large enough in the frame
     */
    private fun isFaceLargeEnough(face: com.google.mlkit.vision.face.Face, imageWidth: Int, imageHeight: Int): Boolean {
        val faceWidth = face.boundingBox.width().toFloat()
        val faceHeight = face.boundingBox.height().toFloat()

        val widthRatio = faceWidth / imageWidth
        val heightRatio = faceHeight / imageHeight

        return widthRatio >= MIN_FACE_SIZE_RATIO || heightRatio >= MIN_FACE_SIZE_RATIO
    }

    /**
     * Check if face is positioned in the center of the frame
     */
    private fun isFaceInValidPosition(face: com.google.mlkit.vision.face.Face, imageWidth: Int, imageHeight: Int): Boolean {
        val faceCenterX = face.boundingBox.centerX().toFloat()
        val faceCenterY = face.boundingBox.centerY().toFloat()

        val frameCenterX = imageWidth / 2f
        val frameCenterY = imageHeight / 2f

        val xTolerance = imageWidth * FACE_CENTER_TOLERANCE
        val yTolerance = imageHeight * FACE_CENTER_TOLERANCE

        val xDiff = Math.abs(faceCenterX - frameCenterX)
        val yDiff = Math.abs(faceCenterY - frameCenterY)

        return xDiff <= xTolerance && yDiff <= yTolerance
    }

    /**
     * Check if current face bounds are similar to last detected bounds (stability check)
     */
    private fun areFaceBoundsSimilar(currentBounds: android.graphics.RectF, lastBounds: android.graphics.RectF?): Boolean {
        if (lastBounds == null) return false

        val widthDiff = Math.abs(currentBounds.width() - lastBounds.width()) / currentBounds.width()
        val heightDiff = Math.abs(currentBounds.height() - lastBounds.height()) / currentBounds.height()
        val xDiff = Math.abs(currentBounds.centerX() - lastBounds.centerX()) / currentBounds.width()
        val yDiff = Math.abs(currentBounds.centerY() - lastBounds.centerY()) / currentBounds.height()

        return widthDiff < FACE_BOUNDS_SIMILARITY_THRESHOLD &&
               heightDiff < FACE_BOUNDS_SIMILARITY_THRESHOLD &&
               xDiff < FACE_BOUNDS_SIMILARITY_THRESHOLD &&
               yDiff < FACE_BOUNDS_SIMILARITY_THRESHOLD
    }

    /**
     * Start countdown before capturing face
     */
    private fun startCaptureCountdown(onComplete: () -> Unit) {
        if (isCountingDown) return

        isCountingDown = true
        countdownValue = COUNTDOWN_SECONDS

        val handler = android.os.Handler(android.os.Looper.getMainLooper())
        val runnable = object : Runnable {
            override fun run() {
                if (countdownValue > 0) {
                    updateStatus("Tahan posisi... $countdownValue")
                    countdownValue--
                    handler.postDelayed(this, 1000)
                } else {
                    updateStatus("Sempurna! Mengambil gambar...")
                    isCountingDown = false
                    onComplete()
                }
            }
        }
        handler.post(runnable)
    }

    private fun processAttendance() {
        if (isProcessing) return

        isProcessing = true
        binding.progressBar.visibility = android.view.View.VISIBLE
        updateStatus("Memproses...")

        // Get GPS location
        val location = getCurrentLocation()
        if (location == null) {
            isProcessing = false
            binding.progressBar.visibility = android.view.View.GONE
            showErrorDialog(
                "Lokasi Tidak Ditemukan",
                "Tidak dapat mengambil lokasi GPS. Pastikan GPS aktif dan izin lokasi telah diberikan."
            )
            return
        }

        // Generate placeholder face embedding (same as backend MVP approach)
        val faceEmbedding = generatePlaceholderEmbedding()

        // Determine attendance type
        val attendanceType = if (isCheckIn) "CHECK_IN" else "CHECK_OUT"

        // Call anonymous API (no login required - uses face recognition for identification)
        CoroutineScope(Dispatchers.Main).launch {
            Log.d(TAG, "Calling anonymous attendance API...")
            Log.d(TAG, "Type: $attendanceType, Lat: ${location.latitude}, Lng: ${location.longitude}")

            val result = withContext(Dispatchers.IO) {
                attendanceRepository.verifyAndCreateAttendanceAnonymous(
                    type = attendanceType,
                    latitude = location.latitude,
                    longitude = location.longitude,
                    faceEmbedding = faceEmbedding
                )
            }

            isProcessing = false
            binding.progressBar.visibility = android.view.View.GONE

            result.fold(
                onSuccess = { attendance ->
                    Log.d(TAG, "✓ Attendance success: ${attendance.id}")

                    // Extract matched user name from response
                    val userName = attendance.user?.name ?: "User"

                    // Show success message with matched user name
                    val successMessage = if (isCheckIn) {
                        "✓ Check In berhasil!\nSelamat datang, $userName"
                    } else {
                        "✓ Check Out berhasil!\nSampai jumpa, $userName"
                    }

                    Toast.makeText(
                        this@CameraActivity,
                        successMessage,
                        Toast.LENGTH_LONG
                    ).show()
                    finish()
                },
                onFailure = { error ->
                    Log.e(TAG, "✗ Attendance failed: ${error.message}")
                    showErrorDialog(
                        if (isCheckIn) "Check In Gagal" else "Check Out Gagal",
                        error.message ?: "Terjadi kesalahan yang tidak diketahui"
                    )
                }
            )
        }
    }

    private fun processRegistration(faceImageBase64: String) {
        if (isProcessing) return

        isProcessing = true
        binding.progressBar.visibility = android.view.View.VISIBLE
        updateStatus("Mengirim data registrasi...")

        // Directly submit registration using stored userName
        submitRegistration(userName, faceImageBase64)
    }

    private fun showNameInputDialog() {
        val editText = EditText(this)
        editText.hint = "Masukkan nama lengkap"

        // Add padding to EditText
        val padding = (16 * resources.displayMetrics.density).toInt()
        editText.setPadding(padding, padding, padding, padding)

        AlertDialog.Builder(this)
            .setTitle("📝 Registrasi Wajah")
            .setMessage("Silakan masukkan nama lengkap Anda terlebih dahulu, kemudian kamera akan dibuka untuk mengambil foto wajah.")
            .setView(editText)
            .setPositiveButton("Lanjutkan") { _, _ ->
                val name = editText.text.toString().trim()
                if (name.isNotEmpty()) {
                    userName = name  // Save name to state
                    updateTitle()    // Update title with name
                    updateStatus("👤 Nama: $name")

                    // NOW start camera after name is entered
                    if (checkPermissions()) {
                        startCamera()
                    } else {
                        requestPermissions()
                    }
                } else {
                    Toast.makeText(
                        this,
                        "Nama tidak boleh kosong",
                        Toast.LENGTH_SHORT
                    ).show()
                    finish()  // Close activity if no name provided
                }
            }
            .setNegativeButton("Batal") { _, _ ->
                finish()  // Close activity if user cancels
            }
            .setCancelable(false)
            .show()
    }

    private fun submitRegistration(name: String, faceImageBase64: String) {
        binding.progressBar.visibility = android.view.View.VISIBLE
        updateStatus("Mengirim data registrasi...")

        CoroutineScope(Dispatchers.IO).launch {
            val result = registrationRepository.submitRegistration(name, faceImageBase64)

            withContext(Dispatchers.Main) {
                binding.progressBar.visibility = android.view.View.GONE

                result.onSuccess { response ->
                    Toast.makeText(
                        this@CameraActivity,
                        "Registrasi berhasil! Status: ${response.status}\n${response.message}",
                        Toast.LENGTH_LONG
                    ).show()
                    finish()
                }.onFailure { error ->
                    Toast.makeText(
                        this@CameraActivity,
                        "Registrasi gagal: ${error.message}",
                        Toast.LENGTH_LONG
                    ).show()
                    isProcessing = false
                    isFaceDetected = false
                }
            }
        }
    }

    /**
     * Get current GPS location
     * Returns Location object or null if unavailable
     */
    private fun getCurrentLocation(): Location? {
        try {
            val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager

            // Check location permissions
            if (ActivityCompat.checkSelfPermission(
                    this,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(
                    this,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                Log.e(TAG, "Location permission not granted")
                return null
            }

            // Try to get last known location from GPS provider
            val gpsLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            if (gpsLocation != null) {
                Log.d(TAG, "Got GPS location: ${gpsLocation.latitude}, ${gpsLocation.longitude}")
                return gpsLocation
            }

            // Fallback to network provider
            val networkLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            if (networkLocation != null) {
                Log.d(TAG, "Got network location: ${networkLocation.latitude}, ${networkLocation.longitude}")
                return networkLocation
            }

            Log.e(TAG, "No location available from GPS or Network")
            return null
        } catch (e: Exception) {
            Log.e(TAG, "Error getting location", e)
            return null
        }
    }

    /**
     * Generate placeholder face embedding for MVP
     * Creates a random 128-dimensional normalized vector (same as backend approach)
     * TODO: Replace with actual face embedding extraction using ML model
     */
    private fun generatePlaceholderEmbedding(): String {
        val embeddingSize = 128
        val embedding = FloatArray(embeddingSize)

        // Generate random values between -1 and 1
        for (i in 0 until embeddingSize) {
            embedding[i] = (Math.random() * 2 - 1).toFloat()
        }

        // Normalize the vector
        var magnitude = 0f
        for (value in embedding) {
            magnitude += value * value
        }
        magnitude = sqrt(magnitude)

        val normalizedEmbedding = embedding.map { it / magnitude }

        // Convert to JSON string
        return normalizedEmbedding.toString()
    }

    /**
     * Show error dialog with title and message
     */
    private fun showErrorDialog(title: String, message: String) {
        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("OK") { dialog, _ ->
                dialog.dismiss()
            }
            .setCancelable(false)
            .show()
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        faceDetector.close()
    }
}

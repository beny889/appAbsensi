package com.absensi.presentation.camera

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.util.Log
import android.view.animation.AnimationUtils
import android.view.animation.AlphaAnimation
import android.view.animation.Animation
import android.view.animation.TranslateAnimation
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.absensi.R
import com.google.android.material.button.MaterialButton
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.absensi.databinding.ActivityCameraBinding
import com.absensi.data.local.EmbeddingStorage
import com.absensi.data.repository.AttendanceRepository
import com.absensi.data.repository.FaceRegistrationRepository
import com.absensi.ml.FaceRecognitionHelper
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
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
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

    // Multi-capture registration state (5 photos for better accuracy)
    private var registrationStep: Int = 0
    private val capturedImages = mutableListOf<String>()  // Base64 images
    private val capturedEmbeddings = mutableListOf<FloatArray>()  // Face embeddings
    private val TOTAL_REGISTRATION_STEPS = 5

    // Guidance messages for each registration step
    private val registrationGuidance = listOf(
        "Lihat LURUS ke kamera",
        "Tengok sedikit ke KIRI",
        "Tengok sedikit ke KANAN",
        "ANGKAT dagu sedikit",
        "TUNDUKKAN kepala sedikit"
    )

    // Repositories
    private val registrationRepository = FaceRegistrationRepository()
    private val attendanceRepository = AttendanceRepository()

    // Token manager for authentication
    private lateinit var tokenManager: TokenManager

    // On-device face recognition
    private lateinit var faceRecognitionHelper: FaceRecognitionHelper
    private lateinit var embeddingStorage: EmbeddingStorage
    private var isOnDeviceReady = false

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

    // Status tracking to prevent flickering
    private var lastStatusMessage: String = ""

    // Transition state to prevent capture during animation
    private var isInTransition: Boolean = false

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

        // Initialize on-device face recognition
        embeddingStorage = EmbeddingStorage(this)
        faceRecognitionHelper = FaceRecognitionHelper(this)

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
            // For attendance mode, initialize face recognition and sync embeddings
            initializeOnDeviceFaceRecognition()
        }
    }

    /**
     * Initialize on-device face recognition
     * 1. Initialize TFLite interpreter
     * 2. Sync embeddings from server
     * 3. Start camera
     */
    private fun initializeOnDeviceFaceRecognition() {
        binding.progressBar.visibility = android.view.View.VISIBLE
        updateStatus("Mempersiapkan face recognition...")

        CoroutineScope(Dispatchers.Main).launch {
            try {
                // Initialize TFLite interpreter on background thread
                withContext(Dispatchers.IO) {
                    faceRecognitionHelper.initialize(useGpu = false)
                }
                Log.d(TAG, "✓ FaceRecognitionHelper initialized")

                // Sync embeddings from server
                updateStatus("Sinkronisasi data wajah...")
                val syncResult = withContext(Dispatchers.IO) {
                    attendanceRepository.syncEmbeddings()
                }

                syncResult.fold(
                    onSuccess = { response ->
                        val supportsMulti = response.supportsMultipleEmbeddings ?: false
                        Log.d(TAG, "✓ Synced ${response.count} users (multi-embeddings: $supportsMulti)")

                        // Save embeddings to local storage (with multiple embeddings support)
                        withContext(Dispatchers.IO) {
                            val userEmbeddings = response.embeddings.map { dto ->
                                // Convert multiple embeddings if available
                                val multiEmbeddings: List<FloatArray> = dto.embeddings?.map { embList ->
                                    embList.toFloatArray()
                                } ?: listOf()

                                val embCount = dto.embeddingsCount ?: 1
                                Log.d(TAG, "User ${dto.name}: $embCount embeddings")

                                EmbeddingStorage.UserEmbedding(
                                    odId = dto.odId,
                                    name = dto.name,
                                    embedding = dto.embedding.toFloatArray(),  // Primary for backward compat
                                    embeddings = multiEmbeddings,  // Multiple for better accuracy
                                    updatedAt = dto.updatedAt
                                )
                            }
                            embeddingStorage.saveEmbeddings(userEmbeddings)
                            embeddingStorage.setLastSyncTimestamp(response.syncTimestamp)
                        }

                        isOnDeviceReady = true
                        binding.progressBar.visibility = android.view.View.GONE

                        // Start camera
                        if (checkPermissions()) {
                            startCamera()
                        } else {
                            requestPermissions()
                        }
                    },
                    onFailure = { error ->
                        Log.e(TAG, "✗ Sync failed: ${error.message}")

                        // Check if we have cached embeddings
                        if (embeddingStorage.hasEmbeddings()) {
                            Log.d(TAG, "Using cached embeddings (${embeddingStorage.getEmbeddingsCount()} users)")
                            isOnDeviceReady = true
                            binding.progressBar.visibility = android.view.View.GONE

                            if (checkPermissions()) {
                                startCamera()
                            } else {
                                requestPermissions()
                            }
                        } else {
                            binding.progressBar.visibility = android.view.View.GONE
                            showErrorDialog(
                                "Gagal Sinkronisasi",
                                "Tidak dapat mengambil data wajah dari server.\n${error.message}"
                            )
                        }
                    }
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error initializing face recognition", e)
                binding.progressBar.visibility = android.view.View.GONE
                showErrorDialog(
                    "Error Inisialisasi",
                    "Gagal mempersiapkan face recognition: ${e.message}"
                )
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
            else -> if (isCheckIn) "Scan Wajah untuk Masuk" else "Scan Wajah untuk Pulang"
        }
    }

    private fun setupListeners() {
        binding.btnCancel.setOnClickListener {
            finish()
        }
    }

    private fun checkPermissions(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestPermissions() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(Manifest.permission.CAMERA),
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
        if (isProcessing || isInTransition) {
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
                                // Use corner state for both modes
                                binding.faceFrameProgress.setCornerState(FaceFrameProgressView.CornerState.WARNING)
                                if (activityMode != MODE_REGISTRATION) {
                                    updateStatus("Wajah terlalu jauh")
                                }
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
                                // Use corner state for both modes
                                binding.faceFrameProgress.setCornerState(FaceFrameProgressView.CornerState.WARNING)
                                if (activityMode != MODE_REGISTRATION) {
                                    updateStatus("Posisikan wajah di tengah")
                                }
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
                                // Use corner state for both modes (READY when stable enough)
                                if (stableFrameCount >= STABILITY_FRAMES / 2) {
                                    binding.faceFrameProgress.setCornerState(FaceFrameProgressView.CornerState.READY)
                                } else {
                                    binding.faceFrameProgress.setCornerState(FaceFrameProgressView.CornerState.DETECTED)
                                }
                                if (activityMode != MODE_REGISTRATION) {
                                    updateStatus("Tahan posisi...")
                                }
                            }
                        } else {
                            stableFrameCount = 1  // Reset but count current frame
                            runOnUiThread {
                                // Use corner state for both modes (DETECTED = face found but not stable)
                                binding.faceFrameProgress.setCornerState(FaceFrameProgressView.CornerState.DETECTED)
                                if (activityMode != MODE_REGISTRATION) {
                                    updateStatus("Wajah terdeteksi")
                                }
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
                                // For attendance mode, also capture face image
                                try {
                                    val faceImageBase64 = ImageUtils.imageProxyToBase64(imageProxy)
                                    runOnUiThread {
                                        startCaptureCountdown {
                                            // Use captured image for face recognition
                                            processAttendance(faceImageBase64)
                                        }
                                    }
                                } catch (e: Exception) {
                                    Log.e(TAG, "Error converting image for attendance", e)
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
                                // Use corner state DEFAULT for both modes
                                binding.faceFrameProgress.setCornerState(FaceFrameProgressView.CornerState.DEFAULT)
                                if (activityMode != MODE_REGISTRATION) {
                                    updateStatus("Mencari wajah...")
                                }
                            }
                        }
                    }
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Face detection failed", e)
                    runOnUiThread {
                        // Use corner state WARNING for both modes
                        binding.faceFrameProgress.setCornerState(FaceFrameProgressView.CornerState.WARNING)
                        if (activityMode != MODE_REGISTRATION) {
                            updateStatus("Deteksi gagal")
                        }
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
        // Only update if message actually changed to prevent flickering
        if (message != lastStatusMessage) {
            lastStatusMessage = message
            binding.tvStatus.text = message
        }
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
     * Start capture with short delay for user to prepare pose
     */
    private fun startCaptureCountdown(onComplete: () -> Unit) {
        if (isCountingDown) return
        isCountingDown = true

        // Delay (3 seconds) for user to prepare pose
        val handler = android.os.Handler(android.os.Looper.getMainLooper())
        handler.postDelayed({
            if (isCountingDown) {  // Only capture if still valid
                onComplete()
                isCountingDown = false
            }
        }, 3000)  // 3 second delay
    }

    private fun processAttendance(faceImageBase64: String) {
        if (isProcessing) return

        isProcessing = true
        binding.progressBar.visibility = android.view.View.VISIBLE
        updateStatus("Memproses face recognition...")

        // Determine attendance type
        val attendanceType = if (isCheckIn) "CHECK_IN" else "CHECK_OUT"

        // Use on-device face recognition
        CoroutineScope(Dispatchers.Main).launch {
            try {
                // Convert base64 to bitmap for face recognition
                val faceBitmap = withContext(Dispatchers.IO) {
                    ImageUtils.base64ToBitmap(faceImageBase64)
                }

                if (faceBitmap == null) {
                    throw Exception("Gagal memproses gambar wajah")
                }

                // Extract face embedding using MobileFaceNet
                updateStatus("Mengekstrak fitur wajah...")
                val embedding = withContext(Dispatchers.IO) {
                    faceRecognitionHelper.extractEmbedding(faceBitmap)
                }
                Log.d(TAG, "✓ Extracted embedding with ${embedding.size} dimensions")

                // Get stored embeddings (multi-embeddings for better accuracy)
                val storedMultiEmbeddings = withContext(Dispatchers.IO) {
                    embeddingStorage.getMultiEmbeddingsMap()
                }
                val userNames = withContext(Dispatchers.IO) {
                    embeddingStorage.getUserNamesMap()
                }

                if (storedMultiEmbeddings.isEmpty()) {
                    throw Exception("Tidak ada data wajah tersimpan. Silakan registrasi terlebih dahulu.")
                }

                // Find best match on-device using multi-embeddings
                updateStatus("Mencocokkan wajah...")
                val matchResult = faceRecognitionHelper.findBestMatchMulti(
                    embedding,
                    storedMultiEmbeddings,
                    FaceRecognitionHelper.DISTANCE_THRESHOLD
                )

                if (matchResult == null) {
                    throw Exception("Wajah tidak dikenali. Pastikan wajah Anda sudah terdaftar dan disetujui admin.")
                }

                val (matchedOdId, distance) = matchResult
                val matchedName = userNames[matchedOdId] ?: "User"
                // Better similarity formula: threshold (1.0) maps to 50%, distance 0 maps to 100%
                val similarity = (1 - distance / 2).coerceIn(0f, 1f)

                Log.d(TAG, "✓ Face matched: $matchedName (distance: $distance, similarity: ${String.format("%.1f", similarity * 100)}%)")

                // Hide progress bar before showing confirmation dialog
                binding.progressBar.visibility = android.view.View.GONE
                isProcessing = false

                // Show identity confirmation dialog
                showIdentityConfirmationDialog(
                    matchedName = matchedName,
                    faceImageBase64 = faceImageBase64,
                    onConfirm = {
                        // User confirmed identity - proceed with attendance
                        isProcessing = true
                        binding.progressBar.visibility = android.view.View.VISIBLE
                        updateStatus("Memproses absensi...")

                        CoroutineScope(Dispatchers.Main).launch {
                            // For CHECK_OUT, check early checkout
                            if (!isCheckIn) {
                                // Get schedule from server for early checkout check
                                val scheduleResult = withContext(Dispatchers.IO) {
                                    attendanceRepository.verifyFaceOnly(faceImageBase64)
                                }

                                scheduleResult.fold(
                                    onSuccess = { scheduleInfo ->
                                        if (scheduleInfo.hasSchedule && scheduleInfo.checkOutTime != null) {
                                            val earlyMinutes = calculateEarlyMinutes(scheduleInfo.checkOutTime)
                                            if (earlyMinutes > 0) {
                                                binding.progressBar.visibility = android.view.View.GONE
                                                isProcessing = false
                                                showEarlyCheckoutConfirmationOnDevice(
                                                    userName = matchedName,
                                                    odId = matchedOdId,
                                                    distance = distance,
                                                    similarity = similarity,
                                                    scheduledTime = scheduleInfo.checkOutTime,
                                                    earlyMinutes = earlyMinutes
                                                )
                                                return@launch
                                            }
                                        }
                                        // Not early - proceed with device-verified checkout
                                        proceedWithDeviceVerifiedAttendance(matchedOdId, attendanceType, distance, similarity, matchedName)
                                    },
                                    onFailure = {
                                        // Can't get schedule, proceed anyway
                                        proceedWithDeviceVerifiedAttendance(matchedOdId, attendanceType, distance, similarity, matchedName)
                                    }
                                )
                            } else {
                                // CHECK_IN - proceed with device-verified attendance
                                proceedWithDeviceVerifiedAttendance(matchedOdId, attendanceType, distance, similarity, matchedName)
                            }
                        }
                    },
                    onCancel = {
                        // User rejected identity - reset for new scan
                        stableFrameCount = 0
                        lastFaceBounds = null
                        isFaceDetected = false
                        isCountingDown = false
                        isProcessing = false
                        updateStatus("Posisikan wajah dalam bingkai")
                    }
                )

            } catch (e: Exception) {
                Log.e(TAG, "✗ On-device face recognition failed: ${e.message}")
                isProcessing = false
                binding.progressBar.visibility = android.view.View.GONE
                showAttendanceErrorDialog(
                    title = "Wajah Tidak Dikenali",
                    message = e.message ?: "Terjadi kesalahan",
                    subMessage = "Pastikan wajah Anda sudah terdaftar dan disetujui admin",
                    isCheckIn = isCheckIn
                )
            }
        }
    }

    /**
     * Proceed with device-verified attendance
     * Sends the matched userId to backend to create attendance record
     */
    private fun proceedWithDeviceVerifiedAttendance(
        odId: String,
        attendanceType: String,
        distance: Float,
        similarity: Float,
        matchedName: String
    ) {
        CoroutineScope(Dispatchers.Main).launch {
            Log.d(TAG, "Creating device-verified attendance: user=$odId, type=$attendanceType")

            val result = withContext(Dispatchers.IO) {
                attendanceRepository.createAttendanceFromDevice(
                    odId = odId,
                    type = attendanceType,
                    distance = distance,
                    similarity = similarity
                )
            }

            isProcessing = false
            binding.progressBar.visibility = android.view.View.GONE

            result.fold(
                onSuccess = { attendance ->
                    Log.d(TAG, "✓ Device-verified attendance success: ${attendance.id}")

                    if (attendanceType == "CHECK_IN") {
                        showSuccessDialog(
                            title = "Masuk Berhasil!",
                            message = "Selamat datang, $matchedName",
                            subMessage = "Semoga harimu menyenangkan!"
                        )
                    } else {
                        val subMsg = if (attendance.isEarlyCheckout == true && attendance.earlyMinutes != null) {
                            "Pulang ${attendance.earlyMinutes} menit lebih awal"
                        } else {
                            "Terima kasih atas kerja kerasnya!"
                        }
                        showSuccessDialog(
                            title = "Pulang Berhasil!",
                            message = "Sampai jumpa, $matchedName",
                            subMessage = subMsg
                        )
                    }
                },
                onFailure = { error ->
                    Log.e(TAG, "✗ Device-verified attendance failed: ${error.message}")
                    handleAttendanceError(error.message ?: "Unknown error", attendanceType)
                }
            )
        }
    }

    /**
     * Show early checkout confirmation for device-verified face
     */
    private fun showEarlyCheckoutConfirmationOnDevice(
        userName: String,
        odId: String,
        distance: Float,
        similarity: Float,
        scheduledTime: String,
        earlyMinutes: Int
    ) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_early_checkout, null)

        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(false)
            .create()

        val tvUserName = dialogView.findViewById<TextView>(R.id.tvUserName)
        val tvCurrentTime = dialogView.findViewById<TextView>(R.id.tvCurrentTime)
        val tvScheduledTime = dialogView.findViewById<TextView>(R.id.tvScheduledTime)
        val tvEarlyMinutes = dialogView.findViewById<TextView>(R.id.tvEarlyMinutes)
        val btnConfirm = dialogView.findViewById<MaterialButton>(R.id.btnConfirm)
        val btnCancel = dialogView.findViewById<MaterialButton>(R.id.btnCancel)

        tvUserName.text = userName
        tvCurrentTime.text = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Calendar.getInstance().time)
        tvScheduledTime.text = scheduledTime
        tvEarlyMinutes.text = "$earlyMinutes menit"

        btnConfirm.setOnClickListener {
            dialog.dismiss()
            isProcessing = true
            binding.progressBar.visibility = android.view.View.VISIBLE
            updateStatus("Memproses Pulang...")
            proceedWithDeviceVerifiedAttendance(odId, "CHECK_OUT", distance, similarity, userName)
        }

        btnCancel.setOnClickListener {
            dialog.dismiss()
            stableFrameCount = 0
            lastFaceBounds = null
            isFaceDetected = false
            isCountingDown = false
            isProcessing = false
        }

        dialog.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        dialog.show()

        val iconContainer = dialogView.findViewById<android.widget.FrameLayout>(R.id.iconContainer)
        iconContainer?.let {
            it.scaleX = 0f
            it.scaleY = 0f
            it.animate()
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(300)
                .setInterpolator(android.view.animation.OvershootInterpolator())
                .start()
        }
    }

    /**
     * Handle attendance error with specific messages
     */
    private fun handleAttendanceError(errorMessage: String, attendanceType: String) {
        val (title, subMessage) = when {
            errorMessage.contains("sudah check in", ignoreCase = true) ||
            errorMessage.contains("sudah Masuk", ignoreCase = true) ||
            errorMessage.contains("already checked in", ignoreCase = true) -> {
                Pair("Sudah Masuk", "Anda sudah melakukan Masuk hari ini")
            }
            errorMessage.contains("belum check in", ignoreCase = true) ||
            errorMessage.contains("belum Masuk", ignoreCase = true) ||
            errorMessage.contains("must check in first", ignoreCase = true) -> {
                Pair("Belum Masuk", "Silakan lakukan Masuk terlebih dahulu")
            }
            errorMessage.contains("sudah check out", ignoreCase = true) ||
            errorMessage.contains("sudah Pulang", ignoreCase = true) ||
            errorMessage.contains("already checked out", ignoreCase = true) -> {
                Pair("Sudah Pulang", "Anda sudah melakukan Pulang hari ini")
            }
            errorMessage.contains("inactive", ignoreCase = true) -> {
                Pair("Akun Tidak Aktif", "Silakan hubungi admin")
            }
            errorMessage.contains("network", ignoreCase = true) ||
            errorMessage.contains("connection", ignoreCase = true) ||
            errorMessage.contains("timeout", ignoreCase = true) -> {
                Pair("Koneksi Gagal", "Periksa koneksi internet Anda dan coba lagi")
            }
            else -> {
                Pair(
                    if (attendanceType == "CHECK_IN") "Masuk Gagal" else "Pulang Gagal",
                    "Silakan coba lagi atau hubungi admin"
                )
            }
        }

        showAttendanceErrorDialog(
            title = title,
            message = errorMessage,
            subMessage = subMessage,
            isCheckIn = attendanceType == "CHECK_IN"
        )
    }

    /**
     * Show identity confirmation dialog before proceeding with attendance
     */
    private fun showIdentityConfirmationDialog(
        matchedName: String,
        faceImageBase64: String,
        onConfirm: () -> Unit,
        onCancel: () -> Unit
    ) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_identity_confirmation, null)

        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(false)
            .create()

        // Get views
        val ivUserPhoto = dialogView.findViewById<ImageView>(R.id.ivUserPhoto)
        val tvName = dialogView.findViewById<TextView>(R.id.tvName)
        val btnConfirm = dialogView.findViewById<MaterialButton>(R.id.btnConfirm)
        val btnCancel = dialogView.findViewById<MaterialButton>(R.id.btnCancel)

        // Set user photo from base64
        val faceBitmap = ImageUtils.base64ToBitmap(faceImageBase64)
        if (faceBitmap != null) {
            ivUserPhoto.setImageBitmap(faceBitmap)
        }

        // Set name
        tvName.text = matchedName

        // Button click handlers
        btnConfirm.setOnClickListener {
            dialog.dismiss()
            onConfirm()
        }

        btnCancel.setOnClickListener {
            dialog.dismiss()
            onCancel()
        }

        // Show dialog with transparent background
        dialog.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        dialog.show()
    }

    /**
     * Calculate how many minutes early the checkout is
     * @param scheduledTime Time in HH:mm format
     * @return Number of minutes early (0 if on time or late)
     */
    private fun calculateEarlyMinutes(scheduledTime: String): Int {
        try {
            val parts = scheduledTime.split(":")
            if (parts.size != 2) return 0

            val scheduleHour = parts[0].toInt()
            val scheduleMinute = parts[1].toInt()

            val calendar = Calendar.getInstance()
            val currentHour = calendar.get(Calendar.HOUR_OF_DAY)
            val currentMinute = calendar.get(Calendar.MINUTE)

            val scheduleTotalMinutes = scheduleHour * 60 + scheduleMinute
            val currentTotalMinutes = currentHour * 60 + currentMinute

            val diff = scheduleTotalMinutes - currentTotalMinutes
            return if (diff > 0) diff else 0
        } catch (e: Exception) {
            Log.e(TAG, "Error calculating early minutes", e)
            return 0
        }
    }

    /**
     * Show early checkout confirmation dialog
     */
    private fun showEarlyCheckoutConfirmation(
        userName: String,
        scheduledTime: String,
        earlyMinutes: Int,
        faceImageBase64: String
    ) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_early_checkout, null)

        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(false)
            .create()

        // Get views
        val tvUserName = dialogView.findViewById<TextView>(R.id.tvUserName)
        val tvCurrentTime = dialogView.findViewById<TextView>(R.id.tvCurrentTime)
        val tvScheduledTime = dialogView.findViewById<TextView>(R.id.tvScheduledTime)
        val tvEarlyMinutes = dialogView.findViewById<TextView>(R.id.tvEarlyMinutes)
        val btnConfirm = dialogView.findViewById<MaterialButton>(R.id.btnConfirm)
        val btnCancel = dialogView.findViewById<MaterialButton>(R.id.btnCancel)

        // Set values
        tvUserName.text = userName
        tvCurrentTime.text = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Calendar.getInstance().time)
        tvScheduledTime.text = scheduledTime
        tvEarlyMinutes.text = "$earlyMinutes menit"

        // Button click handlers
        btnConfirm.setOnClickListener {
            dialog.dismiss()
            // Proceed with checkout
            isProcessing = true
            binding.progressBar.visibility = android.view.View.VISIBLE
            updateStatus("Memproses Pulang...")
            proceedWithAttendance(faceImageBase64, "CHECK_OUT")
        }

        btnCancel.setOnClickListener {
            dialog.dismiss()
            // Reset state
            stableFrameCount = 0
            lastFaceBounds = null
            isFaceDetected = false
            isCountingDown = false
            isProcessing = false
        }

        // Show dialog
        dialog.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        dialog.show()

        // Animate icon
        val iconContainer = dialogView.findViewById<android.widget.FrameLayout>(R.id.iconContainer)
        iconContainer?.let {
            it.scaleX = 0f
            it.scaleY = 0f
            it.animate()
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(300)
                .setInterpolator(android.view.animation.OvershootInterpolator())
                .start()
        }
    }

    /**
     * Proceed with actual attendance creation
     */
    private fun proceedWithAttendance(faceImageBase64: String, attendanceType: String) {
        CoroutineScope(Dispatchers.Main).launch {
            Log.d(TAG, "Calling anonymous attendance API with face image...")
            Log.d(TAG, "Type: $attendanceType")
            Log.d(TAG, "Face image base64 length: ${faceImageBase64.length}")

            val result = withContext(Dispatchers.IO) {
                attendanceRepository.verifyAndCreateAttendanceAnonymous(
                    type = attendanceType,
                    faceEmbedding = faceImageBase64
                )
            }

            isProcessing = false
            binding.progressBar.visibility = android.view.View.GONE

            result.fold(
                onSuccess = { attendance ->
                    Log.d(TAG, "✓ Attendance success: ${attendance.id}")

                    // Extract matched user name from response
                    val matchedUserName = attendance.user?.name ?: "User"

                    // Show modern success dialog
                    if (attendanceType == "CHECK_IN") {
                        showSuccessDialog(
                            title = "Masuk Berhasil!",
                            message = "Selamat datang, $matchedUserName",
                            subMessage = "Semoga harimu menyenangkan!"
                        )
                    } else {
                        // Show Pulang success with late/early info if available
                        val subMsg = if (attendance.isEarlyCheckout == true && attendance.earlyMinutes != null) {
                            "Pulang ${attendance.earlyMinutes} menit lebih awal"
                        } else {
                            "Terima kasih atas kerja kerasnya!"
                        }
                        showSuccessDialog(
                            title = "Pulang Berhasil!",
                            message = "Sampai jumpa, $matchedUserName",
                            subMessage = subMsg
                        )
                    }
                },
                onFailure = { error ->
                    Log.e(TAG, "✗ Attendance failed: ${error.message}")
                    val errorMessage = error.message ?: "Terjadi kesalahan yang tidak diketahui"

                    // Provide specific guidance based on error type
                    val (title, subMessage) = when {
                        errorMessage.contains("tidak ditemukan", ignoreCase = true) ||
                        errorMessage.contains("tidak dikenali", ignoreCase = true) ||
                        errorMessage.contains("not found", ignoreCase = true) ||
                        errorMessage.contains("not recognized", ignoreCase = true) ||
                        errorMessage.contains("No matching", ignoreCase = true) -> {
                            Pair(
                                "Wajah Tidak Dikenali",
                                "Pastikan wajah Anda sudah terdaftar dan disetujui admin"
                            )
                        }
                        errorMessage.contains("sudah check in", ignoreCase = true) ||
                        errorMessage.contains("sudah Masuk", ignoreCase = true) ||
                        errorMessage.contains("already checked in", ignoreCase = true) -> {
                            Pair(
                                "Sudah Masuk",
                                "Anda sudah melakukan Masuk hari ini"
                            )
                        }
                        errorMessage.contains("belum check in", ignoreCase = true) ||
                        errorMessage.contains("belum Masuk", ignoreCase = true) ||
                        errorMessage.contains("must check in first", ignoreCase = true) -> {
                            Pair(
                                "Belum Masuk",
                                "Silakan lakukan Masuk terlebih dahulu"
                            )
                        }
                        errorMessage.contains("sudah check out", ignoreCase = true) ||
                        errorMessage.contains("sudah Pulang", ignoreCase = true) ||
                        errorMessage.contains("already checked out", ignoreCase = true) -> {
                            Pair(
                                "Sudah Pulang",
                                "Anda sudah melakukan Pulang hari ini"
                            )
                        }
                        errorMessage.contains("network", ignoreCase = true) ||
                        errorMessage.contains("connection", ignoreCase = true) ||
                        errorMessage.contains("timeout", ignoreCase = true) -> {
                            Pair(
                                "Koneksi Gagal",
                                "Periksa koneksi internet Anda dan coba lagi"
                            )
                        }
                        else -> {
                            Pair(
                                if (attendanceType == "CHECK_IN") "Masuk Gagal" else "Pulang Gagal",
                                "Silakan coba lagi atau hubungi admin"
                            )
                        }
                    }

                    showAttendanceErrorDialog(
                        title = title,
                        message = errorMessage,
                        subMessage = subMessage,
                        isCheckIn = attendanceType == "CHECK_IN"
                    )
                }
            )
        }
    }

    private fun processRegistration(faceImageBase64: String) {
        if (isProcessing) return

        isProcessing = true
        binding.progressBar.visibility = android.view.View.VISIBLE
        // tvStatus stays showing pose guidance - progressBar indicates processing

        // Extract embedding on-device using MobileFaceNet
        CoroutineScope(Dispatchers.Main).launch {
            try {
                // Initialize FaceRecognitionHelper if needed
                if (!::faceRecognitionHelper.isInitialized) {
                    faceRecognitionHelper = FaceRecognitionHelper(this@CameraActivity)
                }

                withContext(Dispatchers.IO) {
                    try {
                        faceRecognitionHelper.initialize(useGpu = false)
                    } catch (e: Exception) {
                        // Already initialized, ignore
                    }
                }

                // Convert base64 to bitmap
                val faceBitmap = withContext(Dispatchers.IO) {
                    ImageUtils.base64ToBitmap(faceImageBase64)
                }

                if (faceBitmap == null) {
                    throw Exception("Gagal memproses gambar wajah")
                }

                // Extract embedding using MobileFaceNet
                val embedding = withContext(Dispatchers.IO) {
                    faceRecognitionHelper.extractEmbedding(faceBitmap)
                }

                Log.d(TAG, "✓ Step ${registrationStep + 1}: Extracted embedding with ${embedding.size} dimensions")

                // Store image and embedding
                capturedImages.add(faceImageBase64)
                capturedEmbeddings.add(embedding)

                registrationStep++

                // Check if all steps completed
                if (registrationStep >= TOTAL_REGISTRATION_STEPS) {
                    // All 5 photos captured - submit to backend
                    binding.faceFrameProgress.setProgress(TOTAL_REGISTRATION_STEPS)  // Full progress
                    // Show final flash animation
                    showFlashAnimation()
                    // Hide arrow indicator
                    hideArrowIndicator()
                    // tvStatus stays showing last pose - progressBar indicates sending
                    submitMultipleRegistration()
                } else {
                    // More photos needed - auto-advance to next step
                    binding.progressBar.visibility = android.view.View.GONE
                    isProcessing = false

                    // Auto-advance with flash feedback (no modal)
                    advanceToNextStep()
                }

            } catch (e: Exception) {
                Log.e(TAG, "✗ Failed to extract embedding for registration step ${registrationStep + 1}: ${e.message}")
                isProcessing = false
                binding.progressBar.visibility = android.view.View.GONE
                showErrorDialog(
                    "Gagal Foto ${registrationStep + 1}",
                    "Gagal memproses wajah: ${e.message}\n\nSilakan coba lagi."
                )
            }
        }
    }

    /**
     * Update registration status with pose guidance only
     */
    private fun updateRegistrationStatus(step: Int) {
        val guidance = registrationGuidance.getOrNull(step) ?: "Foto wajah"
        updateStatus(guidance)  // Pose only, no step number

        // Update face frame progress
        binding.faceFrameProgress.setProgress(step)
    }

    /**
     * Enable/disable registration mode on face frame
     */
    private fun setFaceFrameRegistrationMode(enabled: Boolean) {
        binding.faceFrameProgress.setRegistrationMode(enabled)
    }

    /**
     * Show flash animation when capturing photo
     */
    private fun showFlashAnimation() {
        binding.flashOverlay.visibility = android.view.View.VISIBLE
        binding.flashOverlay.alpha = 0f

        // Flash animation: quick fade in then fade out
        binding.flashOverlay.animate()
            .alpha(0.8f)
            .setDuration(100)
            .withEndAction {
                binding.flashOverlay.animate()
                    .alpha(0f)
                    .setDuration(200)
                    .withEndAction {
                        binding.flashOverlay.visibility = android.view.View.GONE
                    }
                    .start()
            }
            .start()
    }

    /**
     * Show arrow indicator for pose guidance
     * @param step Current registration step (0-4)
     */
    private fun showArrowIndicator(step: Int) {
        val arrowIcon = when (step) {
            0 -> R.drawable.ic_face_center   // Lihat LURUS ke kamera
            1 -> R.drawable.ic_arrow_left    // Tengok sedikit ke KIRI
            2 -> R.drawable.ic_arrow_right   // Tengok sedikit ke KANAN
            3 -> R.drawable.ic_arrow_up      // ANGKAT dagu sedikit
            4 -> R.drawable.ic_arrow_down    // TUNDUKKAN kepala sedikit
            else -> R.drawable.ic_face_center
        }

        binding.ivArrowIndicator.setImageResource(arrowIcon)
        binding.ivArrowIndicator.visibility = android.view.View.VISIBLE

        // Animate arrow to get user attention
        val animation = when (step) {
            1 -> {
                // Left arrow - animate left
                TranslateAnimation(30f, -30f, 0f, 0f).apply {
                    duration = 600
                    repeatCount = Animation.INFINITE
                    repeatMode = Animation.REVERSE
                }
            }
            2 -> {
                // Right arrow - animate right
                TranslateAnimation(-30f, 30f, 0f, 0f).apply {
                    duration = 600
                    repeatCount = Animation.INFINITE
                    repeatMode = Animation.REVERSE
                }
            }
            3 -> {
                // Up arrow - animate up
                TranslateAnimation(0f, 0f, 30f, -30f).apply {
                    duration = 600
                    repeatCount = Animation.INFINITE
                    repeatMode = Animation.REVERSE
                }
            }
            4 -> {
                // Down arrow - animate down
                TranslateAnimation(0f, 0f, -30f, 30f).apply {
                    duration = 600
                    repeatCount = Animation.INFINITE
                    repeatMode = Animation.REVERSE
                }
            }
            else -> {
                // Center - pulse animation
                AlphaAnimation(0.5f, 1f).apply {
                    duration = 800
                    repeatCount = Animation.INFINITE
                    repeatMode = Animation.REVERSE
                }
            }
        }

        binding.ivArrowIndicator.startAnimation(animation)
    }

    /**
     * Hide arrow indicator
     */
    private fun hideArrowIndicator() {
        binding.ivArrowIndicator.clearAnimation()
        binding.ivArrowIndicator.visibility = android.view.View.GONE
    }

    /**
     * Advance to next registration step with flash, checkmark animation, and delay
     */
    private fun advanceToNextStep() {
        // Set transition flag to prevent capture during animation
        isInTransition = true

        // Show flash animation first
        showFlashAnimation()

        // Show checkmark animation for completed pose
        binding.faceFrameProgress.showCheckmarkAnimation()

        // Hide arrow during transition
        hideArrowIndicator()

        // Add delay (1.5 seconds) for user to see checkmark and prepare for next pose
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            // Reset for next capture
            resetForNextCapture()

            // Update status with next pose guidance
            updateRegistrationStatus(registrationStep)

            // Show arrow for new pose
            showArrowIndicator(registrationStep)

            // Clear transition flag - ready for next capture
            isInTransition = false
        }, 1500)  // 1.5 second delay for transition
    }

    /**
     * Reset state for next capture in multi-step registration
     */
    private fun resetForNextCapture() {
        stableFrameCount = 0
        lastFaceBounds = null
        isFaceDetected = false
        isCountingDown = false
        isProcessing = false
    }

    /**
     * Submit registration with multiple images/embeddings
     */
    private fun submitMultipleRegistration() {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                // Convert all embeddings to JSON array strings
                val embeddingsJson = capturedEmbeddings.map { embedding ->
                    embedding.joinToString(separator = ",", prefix = "[", postfix = "]")
                }

                Log.d(TAG, "Submitting registration with ${capturedImages.size} images and ${embeddingsJson.size} embeddings")

                // Use the new repository method for multiple images
                val result = withContext(Dispatchers.IO) {
                    registrationRepository.submitRegistrationWithMultipleEmbeddings(
                        name = userName,
                        faceEmbeddings = embeddingsJson,
                        faceImagesBase64 = capturedImages
                    )
                }

                result.fold(
                    onSuccess = { response ->
                        Log.d(TAG, "✓ Multi-image registration successful")
                        isProcessing = false
                        binding.progressBar.visibility = android.view.View.GONE

                        // Show success dialog
                        showRegistrationSuccessDialog(response.embeddingsCount ?: TOTAL_REGISTRATION_STEPS)
                    },
                    onFailure = { error ->
                        Log.e(TAG, "✗ Multi-image registration failed: ${error.message}")
                        isProcessing = false
                        binding.progressBar.visibility = android.view.View.GONE
                        showErrorDialog(
                            "Registrasi Gagal",
                            error.message ?: "Terjadi kesalahan saat mengirim data"
                        )
                    }
                )
            } catch (e: Exception) {
                Log.e(TAG, "✗ Exception in submitMultipleRegistration: ${e.message}")
                isProcessing = false
                binding.progressBar.visibility = android.view.View.GONE
                showErrorDialog(
                    "Registrasi Gagal",
                    "Error: ${e.message}"
                )
            }
        }
    }

    /**
     * Show registration success dialog with embeddings count
     */
    private fun showRegistrationSuccessDialog(embeddingsCount: Int) {
        com.google.android.material.dialog.MaterialAlertDialogBuilder(this)
            .setIcon(android.R.drawable.ic_dialog_info)
            .setTitle("Registrasi Berhasil!")
            .setMessage("Data wajah Anda ($embeddingsCount foto) telah dikirim.\n\nSilakan tunggu persetujuan admin untuk mulai menggunakan sistem absensi.")
            .setPositiveButton("OK") { dialog, _ ->
                dialog.dismiss()
                finish()
            }
            .setCancelable(false)
            .show()
    }

    private fun showNameInputDialog() {
        val minNameLength = 3

        // Create rounded EditText with modern styling
        val editText = EditText(this).apply {
            hint = "Masukkan nama lengkap (min. $minNameLength karakter)"
            textSize = 18f
            setTextColor(ContextCompat.getColor(context, android.R.color.black))
            setHintTextColor(ContextCompat.getColor(context, android.R.color.darker_gray))

            // Add padding
            val padding = (20 * resources.displayMetrics.density).toInt()
            setPadding(padding, padding, padding, padding)

            // Modern rounded background
            background = ContextCompat.getDrawable(context, android.R.drawable.editbox_background)
            setSingleLine()

            // Input type for better keyboard
            inputType = android.text.InputType.TYPE_CLASS_TEXT or
                       android.text.InputType.TYPE_TEXT_FLAG_CAP_WORDS
        }

        // Helper text to show character count
        val helperText = android.widget.TextView(this).apply {
            text = "0/$minNameLength karakter"
            textSize = 12f
            setTextColor(ContextCompat.getColor(context, android.R.color.darker_gray))
            val paddingHorizontal = (20 * resources.displayMetrics.density).toInt()
            val paddingVertical = (8 * resources.displayMetrics.density).toInt()
            setPadding(paddingHorizontal, paddingVertical, paddingHorizontal, 0)
        }

        // Create custom view container with padding
        val container = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            val containerPadding = (24 * resources.displayMetrics.density).toInt()
            setPadding(containerPadding, containerPadding / 2, containerPadding, 0)
            addView(editText)
            addView(helperText)
        }

        val dialog = com.google.android.material.dialog.MaterialAlertDialogBuilder(this)
            .setIcon(android.R.drawable.ic_menu_camera)
            .setTitle("📸 Registrasi Wajah")
            .setMessage("Silakan masukkan nama lengkap Anda terlebih dahulu, kemudian kamera akan dibuka untuk mengambil foto wajah.")
            .setView(container)
            .setPositiveButton("LANJUTKAN") { dialog, _ ->
                val name = editText.text.toString().trim()
                userName = name  // Save name to state
                updateTitle()    // Update title with name
                dialog.dismiss()

                // Reset multi-capture registration state
                registrationStep = 0
                capturedImages.clear()
                capturedEmbeddings.clear()

                // Enable registration mode on face frame and update status
                setFaceFrameRegistrationMode(true)
                updateRegistrationStatus(0)

                // Show arrow indicator for first pose
                showArrowIndicator(0)

                if (checkPermissions()) {
                    startCamera()
                } else {
                    requestPermissions()
                }
            }
            .setNegativeButton("BATAL") { _, _ ->
                finish()  // Close activity if user cancels
            }
            .setCancelable(false)
            .create()

        dialog.show()

        // Initially disable the positive button until valid input
        val positiveButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
        positiveButton?.isEnabled = false

        // Add TextWatcher for real-time validation
        editText.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: android.text.Editable?) {
                val length = s?.toString()?.trim()?.length ?: 0
                val isValid = length >= minNameLength

                // Update helper text
                helperText.text = "$length/$minNameLength karakter"
                helperText.setTextColor(
                    ContextCompat.getColor(
                        this@CameraActivity,
                        if (isValid) android.R.color.holo_green_dark else android.R.color.darker_gray
                    )
                )

                // Enable/disable button
                positiveButton?.isEnabled = isValid
                positiveButton?.alpha = if (isValid) 1.0f else 0.5f
            }
        })

        // Auto-focus and show keyboard
        editText.requestFocus()
        dialog.window?.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE)

        // Style the buttons
        positiveButton?.apply {
            setTextColor(ContextCompat.getColor(this@CameraActivity, android.R.color.holo_blue_dark))
            textSize = 16f
            isAllCaps = false
            alpha = 0.5f  // Initially dimmed since disabled
        }
        dialog.getButton(AlertDialog.BUTTON_NEGATIVE)?.apply {
            setTextColor(ContextCompat.getColor(this@CameraActivity, android.R.color.darker_gray))
            textSize = 16f
            isAllCaps = false
        }
    }

    private fun submitRegistration(name: String, faceImageBase64: String) {
        binding.progressBar.visibility = android.view.View.VISIBLE
        // tvStatus stays showing pose - progressBar indicates sending

        CoroutineScope(Dispatchers.IO).launch {
            val result = registrationRepository.submitRegistration(name, faceImageBase64)

            withContext(Dispatchers.Main) {
                binding.progressBar.visibility = android.view.View.GONE

                result.onSuccess { response ->
                    // Show modern success dialog for registration
                    showSuccessDialog(
                        title = "Registrasi Berhasil!",
                        message = "Data wajah Anda telah dikirim",
                        subMessage = "Tunggu persetujuan admin untuk dapat melakukan absensi"
                    )
                }.onFailure { error ->
                    // Show error dialog instead of toast for better visibility
                    showErrorDialog(
                        "Registrasi Gagal",
                        error.message ?: "Terjadi kesalahan yang tidak diketahui"
                    )
                    isProcessing = false
                    isFaceDetected = false
                }
            }
        }
    }

    /**
     * Submit registration with pre-computed MobileFaceNet embedding
     */
    private fun submitRegistrationWithEmbedding(name: String, embeddingJson: String, faceImageBase64: String) {
        CoroutineScope(Dispatchers.IO).launch {
            val result = registrationRepository.submitRegistrationWithEmbedding(
                name = name,
                faceEmbedding = embeddingJson,
                faceImageBase64 = faceImageBase64
            )

            withContext(Dispatchers.Main) {
                binding.progressBar.visibility = android.view.View.GONE

                result.onSuccess { response ->
                    showSuccessDialog(
                        title = "Registrasi Berhasil!",
                        message = "Data wajah Anda telah dikirim",
                        subMessage = "Tunggu persetujuan admin untuk dapat melakukan absensi"
                    )
                }.onFailure { error ->
                    showErrorDialog(
                        "Registrasi Gagal",
                        error.message ?: "Terjadi kesalahan yang tidak diketahui"
                    )
                    isProcessing = false
                    isFaceDetected = false
                }
            }
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
     * Show modern success dialog
     */
    private fun showSuccessDialog(title: String, message: String, subMessage: String? = null) {
        showResultDialog(
            type = DialogType.SUCCESS,
            title = title,
            message = message,
            subMessage = subMessage,
            buttonText = "OK",
            onDismiss = { finish() }
        )
    }

    /**
     * Show modern error dialog
     */
    private fun showErrorDialog(title: String, message: String) {
        showResultDialog(
            type = DialogType.ERROR,
            title = title,
            message = message,
            subMessage = null,
            buttonText = "Coba Lagi",
            onDismiss = {
                // Reset state for retry
                stableFrameCount = 0
                lastFaceBounds = null
                isFaceDetected = false
                isCountingDown = false
            }
        )
    }

    /**
     * Show attendance-specific error dialog with retry and close options
     */
    private fun showAttendanceErrorDialog(
        title: String,
        message: String,
        subMessage: String,
        isCheckIn: Boolean
    ) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_result, null)

        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(false)
            .create()

        // Get views
        val iconBackground = dialogView.findViewById<android.view.View>(R.id.iconBackground)
        val ivIcon = dialogView.findViewById<ImageView>(R.id.ivIcon)
        val tvTitle = dialogView.findViewById<TextView>(R.id.tvTitle)
        val tvMessage = dialogView.findViewById<TextView>(R.id.tvMessage)
        val tvSubMessage = dialogView.findViewById<TextView>(R.id.tvSubMessage)
        val btnAction = dialogView.findViewById<MaterialButton>(R.id.btnAction)

        // Set content
        tvTitle.text = title
        tvMessage.text = message
        tvSubMessage.text = subMessage
        tvSubMessage.visibility = android.view.View.VISIBLE

        // Error styling
        iconBackground.setBackgroundResource(R.drawable.circle_error)
        ivIcon.setImageResource(android.R.drawable.ic_dialog_alert)
        tvTitle.setTextColor(Color.parseColor("#C62828"))

        // Change button to "Coba Lagi" with error color
        btnAction.text = "Coba Lagi"
        btnAction.setBackgroundColor(Color.parseColor("#F44336"))

        // Add a secondary "Tutup" button
        val container = dialogView.findViewById<android.widget.LinearLayout>(dialogView.id)?.parent as? android.widget.LinearLayout

        // Create close button
        val btnClose = MaterialButton(this).apply {
            text = "Tutup"
            textSize = 16f
            isAllCaps = false
            setTextColor(Color.parseColor("#666666"))
            setBackgroundColor(Color.TRANSPARENT)
            strokeColor = android.content.res.ColorStateList.valueOf(Color.parseColor("#CCCCCC"))
            strokeWidth = 2
            cornerRadius = (28 * resources.displayMetrics.density).toInt()
            layoutParams = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                (56 * resources.displayMetrics.density).toInt()
            ).apply {
                topMargin = (12 * resources.displayMetrics.density).toInt()
            }
        }

        // Find the parent LinearLayout and add close button after action button
        val parentLayout = btnAction.parent as? android.widget.LinearLayout
        parentLayout?.addView(btnClose)

        // Button click handlers
        btnAction.setOnClickListener {
            dialog.dismiss()
            // Reset state for retry
            stableFrameCount = 0
            lastFaceBounds = null
            isFaceDetected = false
            isCountingDown = false
            isProcessing = false
        }

        btnClose.setOnClickListener {
            dialog.dismiss()
            finish()
        }

        // Show dialog with transparent background
        dialog.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        dialog.show()

        // Animate icon container with shake effect for error
        val iconContainer = dialogView.findViewById<android.widget.FrameLayout>(R.id.iconContainer)
        iconContainer.scaleX = 0f
        iconContainer.scaleY = 0f
        iconContainer.animate()
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(300)
            .setInterpolator(android.view.animation.OvershootInterpolator())
            .withEndAction {
                // Add shake animation after scale
                val shake = android.view.animation.TranslateAnimation(-10f, 10f, 0f, 0f).apply {
                    duration = 50
                    repeatCount = 5
                    repeatMode = android.view.animation.Animation.REVERSE
                }
                iconContainer.startAnimation(shake)
            }
            .start()
    }

    /**
     * Dialog type enum for styling
     */
    private enum class DialogType {
        SUCCESS, ERROR, WARNING, INFO
    }

    /**
     * Show modern result dialog with custom styling
     */
    private fun showResultDialog(
        type: DialogType,
        title: String,
        message: String,
        subMessage: String?,
        buttonText: String,
        onDismiss: () -> Unit
    ) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_result, null)

        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(false)
            .create()

        // Get views
        val iconBackground = dialogView.findViewById<android.view.View>(R.id.iconBackground)
        val ivIcon = dialogView.findViewById<ImageView>(R.id.ivIcon)
        val tvTitle = dialogView.findViewById<TextView>(R.id.tvTitle)
        val tvMessage = dialogView.findViewById<TextView>(R.id.tvMessage)
        val tvSubMessage = dialogView.findViewById<TextView>(R.id.tvSubMessage)
        val btnAction = dialogView.findViewById<MaterialButton>(R.id.btnAction)

        // Set content
        tvTitle.text = title
        tvMessage.text = message
        btnAction.text = buttonText

        // Handle sub message
        if (!subMessage.isNullOrEmpty()) {
            tvSubMessage.text = subMessage
            tvSubMessage.visibility = android.view.View.VISIBLE
        } else {
            tvSubMessage.visibility = android.view.View.GONE
        }

        // Style based on type
        when (type) {
            DialogType.SUCCESS -> {
                iconBackground.setBackgroundResource(R.drawable.circle_success)
                ivIcon.setImageResource(android.R.drawable.ic_dialog_info)
                btnAction.setBackgroundColor(Color.parseColor("#4CAF50"))
                tvTitle.setTextColor(Color.parseColor("#2E7D32"))
            }
            DialogType.ERROR -> {
                iconBackground.setBackgroundResource(R.drawable.circle_error)
                ivIcon.setImageResource(android.R.drawable.ic_dialog_alert)
                btnAction.setBackgroundColor(Color.parseColor("#F44336"))
                tvTitle.setTextColor(Color.parseColor("#C62828"))
            }
            DialogType.WARNING -> {
                iconBackground.setBackgroundResource(R.drawable.circle_warning)
                ivIcon.setImageResource(android.R.drawable.ic_dialog_alert)
                btnAction.setBackgroundColor(Color.parseColor("#FF9800"))
                tvTitle.setTextColor(Color.parseColor("#EF6C00"))
            }
            DialogType.INFO -> {
                iconBackground.setBackgroundResource(R.drawable.circle_info)
                ivIcon.setImageResource(android.R.drawable.ic_dialog_info)
                btnAction.setBackgroundColor(Color.parseColor("#2196F3"))
                tvTitle.setTextColor(Color.parseColor("#1565C0"))
            }
        }

        // Button click handler
        btnAction.setOnClickListener {
            dialog.dismiss()
            onDismiss()
        }

        // Show dialog with transparent background
        dialog.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        dialog.show()

        // Animate icon container
        val iconContainer = dialogView.findViewById<android.widget.FrameLayout>(R.id.iconContainer)
        iconContainer.scaleX = 0f
        iconContainer.scaleY = 0f
        iconContainer.animate()
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(300)
            .setInterpolator(android.view.animation.OvershootInterpolator())
            .start()
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        faceDetector.close()

        // Close FaceRecognitionHelper to release TFLite resources
        if (::faceRecognitionHelper.isInitialized) {
            faceRecognitionHelper.close()
        }
    }
}

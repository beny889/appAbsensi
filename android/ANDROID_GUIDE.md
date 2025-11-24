# Android App - Development Guide

Panduan lengkap untuk membangun Android app untuk sistem absensi.

## 📋 Setup Requirements

```gradle
// app/build.gradle
android {
    compileSdk 34

    defaultConfig {
        applicationId "com.absensi.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }
}

dependencies {
    // Kotlin
    implementation "org.jetbrains.kotlin:kotlin-stdlib:1.9.0"

    // AndroidX
    implementation "androidx.core:core-ktx:1.12.0"
    implementation "androidx.appcompat:appcompat:1.6.1"
    implementation "androidx.constraintlayout:constraintlayout:2.1.4"
    implementation "androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0"
    implementation "androidx.lifecycle:lifecycle-livedata-ktx:2.7.0"
    implementation "androidx.activity:activity-ktx:1.8.2"
    implementation "androidx.fragment:fragment-ktx:1.6.2"

    // Material Design
    implementation "com.google.android.material:material:1.11.0"

    // Navigation
    implementation "androidx.navigation:navigation-fragment-ktx:2.7.6"
    implementation "androidx.navigation:navigation-ui-ktx:2.7.6"

    // Retrofit (Network)
    implementation "com.squareup.retrofit2:retrofit:2.9.0"
    implementation "com.squareup.retrofit2:converter-gson:2.9.0"
    implementation "com.squareup.okhttp3:logging-interceptor:4.12.0"

    // Room (Local Database)
    implementation "androidx.room:room-runtime:2.6.1"
    implementation "androidx.room:room-ktx:2.6.1"
    kapt "androidx.room:room-compiler:2.6.1"

    // Hilt (Dependency Injection)
    implementation "com.google.dagger:hilt-android:2.48"
    kapt "com.google.dagger:hilt-compiler:2.48"

    // ML Kit Face Detection
    implementation "com.google.mlkit:face-detection:16.1.6"

    // CameraX
    implementation "androidx.camera:camera-camera2:1.3.1"
    implementation "androidx.camera:camera-lifecycle:1.3.1"
    implementation "androidx.camera:camera-view:1.3.1"

    // Google Play Services Location
    implementation "com.google.android.gms:play-services-location:21.1.0"

    // Coroutines
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3"

    // DataStore
    implementation "androidx.datastore:datastore-preferences:1.0.0"

    // Glide (Image Loading)
    implementation "com.github.bumptech.glide:glide:4.16.0"
    kapt "com.github.bumptech.glide:compiler:4.16.0"
}
```

## 📁 Project Structure (MVVM + Clean Architecture)

```
app/src/main/java/com/absensi/
├── di/                          # Dependency Injection
│   ├── AppModule.kt
│   ├── NetworkModule.kt
│   └── DatabaseModule.kt
│
├── data/                        # Data Layer
│   ├── local/
│   │   ├── dao/
│   │   │   ├── UserDao.kt
│   │   │   └── AttendanceDao.kt
│   │   ├── entity/
│   │   │   ├── UserEntity.kt
│   │   │   └── AttendanceEntity.kt
│   │   └── AppDatabase.kt
│   ├── remote/
│   │   ├── api/
│   │   │   ├── AuthApi.kt
│   │   │   ├── AttendanceApi.kt
│   │   │   └── EmployeeApi.kt
│   │   ├── dto/
│   │   │   ├── LoginRequest.kt
│   │   │   ├── LoginResponse.kt
│   │   │   └── AttendanceRequest.kt
│   │   └── interceptor/
│   │       └── AuthInterceptor.kt
│   └── repository/
│       ├── AuthRepository.kt
│       ├── AttendanceRepository.kt
│       └── EmployeeRepository.kt
│
├── domain/                      # Domain Layer
│   ├── model/
│   │   ├── User.kt
│   │   ├── Attendance.kt
│   │   └── Location.kt
│   ├── usecase/
│   │   ├── LoginUseCase.kt
│   │   ├── CheckInUseCase.kt
│   │   ├── CheckOutUseCase.kt
│   │   └── RegisterFaceUseCase.kt
│   └── repository/
│       └── (interfaces)
│
├── presentation/                # Presentation Layer
│   ├── auth/
│   │   ├── LoginFragment.kt
│   │   ├── LoginViewModel.kt
│   │   └── RegisterFragment.kt
│   ├── main/
│   │   ├── MainActivity.kt
│   │   ├── MainViewModel.kt
│   │   └── HomeFragment.kt
│   ├── attendance/
│   │   ├── CheckInFragment.kt
│   │   ├── CheckInViewModel.kt
│   │   ├── HistoryFragment.kt
│   │   └── HistoryViewModel.kt
│   ├── face/
│   │   ├── FaceRegistrationFragment.kt
│   │   ├── FaceRegistrationViewModel.kt
│   │   └── FaceCaptureView.kt
│   └── profile/
│       ├── ProfileFragment.kt
│       └── ProfileViewModel.kt
│
├── util/                        # Utilities
│   ├── Constants.kt
│   ├── Resource.kt
│   ├── Extensions.kt
│   ├── FaceDetectionHelper.kt
│   └── LocationHelper.kt
│
└── AbsensiApplication.kt
```

## 🔑 Key Implementation Files

### 1. Constants.kt

```kotlin
object Constants {
    const val BASE_URL = "http://YOUR_SERVER_IP:3001/api/"
    const val PREF_NAME = "absensi_prefs"
    const val TOKEN_KEY = "auth_token"

    // Face Detection
    const val FACE_SIMILARITY_THRESHOLD = 0.6f
    const val MIN_FACE_SIZE = 0.1f

    // Location
    const val LOCATION_UPDATE_INTERVAL = 10000L
    const val LOCATION_FASTEST_INTERVAL = 5000L
}
```

### 2. AuthApi.kt

```kotlin
interface AuthApi {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): LoginResponse

    @GET("auth/me")
    suspend fun getProfile(): UserResponse
}
```

### 3. AttendanceApi.kt

```kotlin
interface AttendanceApi {
    @POST("attendance/verify")
    suspend fun checkInOut(@Body request: AttendanceRequest): AttendanceResponse

    @GET("attendance/my")
    suspend fun getMyAttendances(
        @Query("startDate") startDate: String?,
        @Query("endDate") endDate: String?
    ): List<AttendanceResponse>

    @GET("attendance/today")
    suspend fun getTodayAttendance(): List<AttendanceResponse>
}
```

### 4. FaceDetectionHelper.kt

```kotlin
class FaceDetectionHelper(private val context: Context) {

    private val detector: FaceDetector

    init {
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            .setMinFaceSize(Constants.MIN_FACE_SIZE)
            .build()

        detector = FaceDetection.getClient(options)
    }

    suspend fun detectFace(bitmap: Bitmap): List<Face> {
        val image = InputImage.fromBitmap(bitmap, 0)
        return detector.process(image).await()
    }

    fun extractEmbedding(face: Face, bitmap: Bitmap): FloatArray {
        // Extract face features/embeddings
        // Implementation depends on ML model
        // Bisa gunakan FaceNet atau model custom

        val boundingBox = face.boundingBox
        val faceBitmap = Bitmap.createBitmap(
            bitmap,
            boundingBox.left,
            boundingBox.top,
            boundingBox.width(),
            boundingBox.height()
        )

        // Process with ML model
        // Return embedding vector
        return floatArrayOf() // placeholder
    }

    fun calculateSimilarity(embedding1: FloatArray, embedding2: FloatArray): Float {
        // Cosine similarity
        var dotProduct = 0f
        var norm1 = 0f
        var norm2 = 0f

        for (i in embedding1.indices) {
            dotProduct += embedding1[i] * embedding2[i]
            norm1 += embedding1[i] * embedding1[i]
            norm2 += embedding2[i] * embedding2[i]
        }

        norm1 = sqrt(norm1)
        norm2 = sqrt(norm2)

        return if (norm1 == 0f || norm2 == 0f) 0f else dotProduct / (norm1 * norm2)
    }
}
```

### 5. LocationHelper.kt

```kotlin
class LocationHelper(private val context: Context) {

    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)

    @SuppressLint("MissingPermission")
    suspend fun getCurrentLocation(): android.location.Location? {
        return suspendCancellableCoroutine { continuation ->
            fusedLocationClient.lastLocation
                .addOnSuccessListener { location ->
                    continuation.resume(location)
                }
                .addOnFailureListener { e ->
                    continuation.resumeWithException(e)
                }
        }
    }

    fun calculateDistance(
        lat1: Double, lon1: Double,
        lat2: Double, lon2: Double
    ): Float {
        val results = FloatArray(1)
        android.location.Location.distanceBetween(lat1, lon1, lat2, lon2, results)
        return results[0]
    }
}
```

### 6. CheckInViewModel.kt

```kotlin
@HiltViewModel
class CheckInViewModel @Inject constructor(
    private val checkInUseCase: CheckInUseCase,
    private val faceDetectionHelper: FaceDetectionHelper,
    private val locationHelper: LocationHelper
) : ViewModel() {

    private val _checkInState = MutableLiveData<Resource<AttendanceResponse>>()
    val checkInState: LiveData<Resource<AttendanceResponse>> = _checkInState

    fun checkIn(capturedBitmap: Bitmap) {
        viewModelScope.launch {
            _checkInState.value = Resource.Loading()

            try {
                // 1. Detect face
                val faces = faceDetectionHelper.detectFace(capturedBitmap)
                if (faces.isEmpty()) {
                    _checkInState.value = Resource.Error("Wajah tidak terdeteksi")
                    return@launch
                }

                // 2. Extract embedding
                val embedding = faceDetectionHelper.extractEmbedding(faces[0], capturedBitmap)

                // 3. Get location
                val location = locationHelper.getCurrentLocation()
                    ?: throw Exception("Gagal mendapatkan lokasi")

                // 4. Send to backend
                val request = AttendanceRequest(
                    type = "CHECK_IN",
                    faceEmbedding = embedding.joinToString(","),
                    latitude = location.latitude,
                    longitude = location.longitude
                )

                val result = checkInUseCase(request)
                _checkInState.value = Resource.Success(result)

            } catch (e: Exception) {
                _checkInState.value = Resource.Error(e.message ?: "Terjadi kesalahan")
            }
        }
    }
}
```

## 📱 Key Features Implementation

### Face Registration ✅ IMPLEMENTED
**Location**: `presentation/camera/CameraActivity.kt`

**Implementation**:
1. User taps "📸 Rekam Data Wajah" button → `HomeFragment.kt:127`
2. CameraActivity opens with MODE_REGISTRATION → `CameraActivity.kt:69`
3. CameraX preview starts → `CameraActivity.kt:133`
4. ImageAnalysis detects faces via ML Kit → `CameraActivity.kt:204`
5. When face detected, convert to base64 → `ImageUtils.kt:12`
6. Show name input dialog → `CameraActivity.kt:289`
7. Submit to API → `FaceRegistrationRepository.kt:17`
8. Backend stores with PENDING status
9. Admin approves via web panel
10. User account created automatically

**Key Code References**:
```kotlin
// CameraActivity.kt:211 - Face detection handler
if (activityMode == MODE_REGISTRATION) {
    try {
        val faceImageBase64 = ImageUtils.imageProxyToBase64(imageProxy)
        runOnUiThread {
            updateStatus("Wajah terdeteksi!")
            processRegistration(faceImageBase64)
        }
    } catch (e: Exception) {
        // Error handling
    }
}

// ImageUtils.kt:12 - Base64 conversion
fun imageProxyToBase64(image: ImageProxy): String {
    val bitmap = imageProxyToBitmap(image)
    return bitmapToBase64(bitmap)
}

// FaceRegistrationRepository.kt:17 - API call
suspend fun submitRegistration(
    name: String,
    faceImageBase64: String
): Result<FaceRegistrationResponse> {
    val request = SubmitFaceRegistrationRequest(name, faceImageBase64)
    val response = apiService.submitFaceRegistration(request)
    // Handle response
}
```

### Check-In
1. Request location permission
2. Get current GPS coordinates
3. Open camera & capture face
4. Extract face embedding
5. Send to backend dengan coordinates
6. Backend verify face & location
7. Show result

### Attendance History
1. Fetch dari backend API
2. Display dalam RecyclerView
3. Group by date
4. Show check-in & check-out time
5. Calculate work duration

## 🔒 Permissions Required (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<uses-feature android:name="android.hardware.camera" />
<uses-feature android:name="android.hardware.camera.autofocus" />
```

## 🎨 UI Recommendations

- Material Design 3 components
- Bottom navigation (Home, History, Profile)
- FloatingActionButton untuk check-in/out
- Card-based layout untuk attendance list
- Dark mode support

## 🧪 Testing

```kotlin
// Unit Test
@Test
fun `test cosine similarity calculation`() {
    val embedding1 = floatArrayOf(1f, 2f, 3f)
    val embedding2 = floatArrayOf(1f, 2f, 3f)
    val similarity = helper.calculateSimilarity(embedding1, embedding2)
    assertEquals(1.0f, similarity, 0.01f)
}

// UI Test
@Test
fun testCheckInFlow() {
    // Test check-in button click
    // Verify camera opens
    // Mock face detection
    // Verify API call
}
```

## 🚀 Build & Run

```bash
# Debug build
./gradlew assembleDebug

# Release build
./gradlew assembleRelease

# Install to device
./gradlew installDebug

# Run tests
./gradlew test
```

## 📦 ProGuard Rules

```proguard
# Retrofit
-keepattributes Signature
-keepattributes *Annotation*
-keep class retrofit2.** { *; }

# Gson
-keep class com.google.gson.** { *; }
-keep class com.absensi.data.remote.dto.** { *; }

# ML Kit
-keep class com.google.mlkit.** { *; }
```

## 🔧 Troubleshooting

### Camera tidak bisa dibuka
- Check permission di runtime
- Verify camera feature di manifest

### GPS tidak akurat
- Request HIGH_ACCURACY mode
- Wait untuk location fix
- Check Google Play Services

### Face detection lambat
- Reduce image resolution
- Use PERFORMANCE_MODE_FAST untuk real-time

---

**Good luck building! 🚀**

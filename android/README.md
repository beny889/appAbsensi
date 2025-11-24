# Android Absensi App

Android application untuk sistem absensi dengan Face Recognition dan GPS.

## ✅ Status: Face Registration Implemented

Project ini sudah memiliki fitur face registration yang lengkap dan siap digunakan.

### 📦 Yang Sudah Diimplementasi

- ✅ Gradle configuration (build.gradle)
- ✅ AndroidManifest.xml dengan permissions
- ✅ Package structure (MVVM + Clean Architecture)
- ✅ Dependencies setup (Hilt, Retrofit, Room, ML Kit, CameraX)
- ✅ Constants & Resource wrapper
- ✅ Data Transfer Objects (DTOs)

### 🎯 Face Registration Feature (NEW!)

- ✅ **CameraActivity** dengan mode switching (attendance/registration)
- ✅ **ML Kit Face Detection** real-time integration
- ✅ **ImageUtils** untuk base64 conversion & image resizing
- ✅ **FaceRegistrationRepository** dengan Retrofit API calls
- ✅ **HomeFragment** dengan "Rekam Data Wajah" button
- ✅ **Name input dialog** untuk registration flow
- ✅ **Network configuration** dengan ADB reverse support

### 📁 Struktur Package

```
com.absensi/
├── AbsensiApplication.kt       # Application class
├── util/
│   ├── Constants.kt           # ✅ Constants
│   └── Resource.kt            # ✅ Resource wrapper
├── data/
│   ├── local/                 # Room Database (TODO)
│   ├── remote/
│   │   ├── api/              # Retrofit APIs (TODO)
│   │   ├── dto/
│   │   │   └── AuthDto.kt    # ✅ Auth DTOs
│   │   └── interceptor/      # Auth interceptor (TODO)
│   └── repository/           # Repositories (TODO)
├── domain/
│   ├── model/                # Domain models (TODO)
│   └── usecase/              # Use cases (TODO)
├── presentation/
│   ├── auth/                 # Login/Register (TODO)
│   ├── main/                 # Main Activity (TODO)
│   ├── attendance/           # Check-in/out (TODO)
│   ├── face/                 # Face Registration (TODO)
│   └── profile/              # Profile (TODO)
└── di/                       # Hilt modules (TODO)
```

## 🎯 Implemented Features

### 1. Face Registration Flow ✅

**Files Implemented**:
- `presentation/camera/CameraActivity.kt` - Camera with face detection
- `presentation/main/HomeFragment.kt` - UI with "Rekam Data" button
- `data/repository/FaceRegistrationRepository.kt` - API integration
- `data/remote/api/ApiService.kt` - Retrofit interface
- `data/remote/api/RetrofitClient.kt` - HTTP client setup
- `data/remote/dto/FaceRegistrationDto.kt` - Request/Response models
- `util/ImageUtils.kt` - Image processing utilities

**How it works**:
1. User taps "📸 Rekam Data Wajah" button in HomeFragment
2. CameraActivity opens in MODE_REGISTRATION
3. ML Kit detects face in real-time
4. When face detected, image converted to base64
5. Name input dialog appears
6. User enters name and submits
7. Data sent to backend API
8. Admin approves in web panel
9. User account created automatically

### 2. Network Configuration ✅

```kotlin
// RetrofitClient.kt
private const val BASE_URL = "http://localhost:3001/api/"

// Setup ADB reverse for USB connection:
// adb reverse tcp:3001 tcp:3001
```

## 🚀 Next Steps untuk Development

### 1. Implement Check-In/Check-Out (TODO)

```kotlin
// data/remote/api/AuthApi.kt
interface AuthApi {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): LoginResponse

    @GET("auth/me")
    suspend fun getProfile(): UserDto
}

// data/remote/api/AttendanceApi.kt
interface AttendanceApi {
    @POST("attendance/verify")
    suspend fun checkInOut(@Body request: AttendanceRequest): AttendanceResponse

    @GET("attendance/my")
    suspend fun getMyAttendances(): List<AttendanceResponse>
}
```

### 2. Implement Dependency Injection

```kotlin
// di/NetworkModule.kt
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor())
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .connectTimeout(Constants.CONNECT_TIMEOUT, TimeUnit.SECONDS)
            .readTimeout(Constants.READ_TIMEOUT, TimeUnit.SECONDS)
            .writeTimeout(Constants.WRITE_TIMEOUT, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(Constants.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideAuthApi(retrofit: Retrofit): AuthApi {
        return retrofit.create(AuthApi::class.java)
    }
}
```

### 3. Implement Face Detection Helper

```kotlin
// util/FaceDetectionHelper.kt
class FaceDetectionHelper(private val context: Context) {

    private val detector: FaceDetector

    init {
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            .setMinFaceSize(Constants.MIN_FACE_SIZE)
            .build()
        detector = FaceDetection.getClient(options)
    }

    suspend fun detectFace(bitmap: Bitmap): List<Face> {
        val image = InputImage.fromBitmap(bitmap, 0)
        return detector.process(image).await()
    }
}
```

### 4. Implement UI dengan ViewBinding

```kotlin
// presentation/auth/LoginActivity.kt
@AndroidEntryPoint
class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private val viewModel: LoginViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupObservers()
        setupListeners()
    }

    private fun setupObservers() {
        viewModel.loginState.observe(this) { resource ->
            when (resource) {
                is Resource.Loading -> showLoading()
                is Resource.Success -> navigateToMain()
                is Resource.Error -> showError(resource.message)
            }
        }
    }
}
```

## 📱 Build & Run

```bash
# 1. Open in Android Studio
File → Open → Select android folder

# 2. Sync Gradle
Tools → Sync Project with Gradle Files

# 3. Setup ADB Reverse (for USB connection)
adb reverse tcp:3001 tcp:3001

# 4. Verify BASE_URL in RetrofitClient.kt
# Already configured: http://localhost:3001/api/

# 5. Build & Run
Run → Run 'app'

# 6. Test Face Registration
# - Tap "📸 Rekam Data Wajah" button
# - Allow camera permission
# - Position face in camera view
# - Wait for face detection
# - Enter your name when prompted
# - Submit registration
# - Check web admin for approval (admin@test.com / admin123)
```

## 🔧 Network Setup

### For Physical Device (USB)
```bash
# Connect device via USB
adb devices

# Setup port forwarding
adb reverse tcp:3001 tcp:3001

# Verify
adb reverse --list
# Should show: tcp:3001 -> tcp:3001

# If connection lost, re-run adb reverse
```

### For Emulator
```kotlin
// Change BASE_URL in RetrofitClient.kt to:
private const val BASE_URL = "http://10.0.2.2:3001/api/"
```

### For WiFi (Same Network)
```kotlin
// Change BASE_URL in RetrofitClient.kt to:
private const val BASE_URL = "http://192.168.x.x:3001/api/"
// Replace x.x with your computer's local IP
```

## 🔧 Configuration Checklist

- [ ] Update `BASE_URL` di Constants.kt
- [ ] Implement AuthInterceptor untuk JWT
- [ ] Create layout XML files
- [ ] Implement ViewModels
- [ ] Add string resources
- [ ] Add drawable resources
- [ ] Setup navigation graph
- [ ] Implement face detection logic
- [ ] Implement location services
- [ ] Test on real device

## 📚 Resources & References

- [ML Kit Face Detection](https://developers.google.com/ml-kit/vision/face-detection)
- [CameraX Guide](https://developer.android.com/training/camerax)
- [Hilt Dependency Injection](https://developer.android.com/training/dependency-injection/hilt-android)
- [Retrofit](https://square.github.io/retrofit/)
- [Room Database](https://developer.android.com/training/data-storage/room)

## 🎯 Implementation Priority

1. **Completed ✅**
   - Face Recording UI
   - Face Detection integration (ML Kit)
   - Face Registration API
   - Base64 image conversion
   - Network setup (ADB reverse)

2. **High Priority (Next)**
   - Auth (Login/Register)
   - Main Dashboard
   - Check-in/Check-out UI with face verification
   - GPS/Location integration

3. **Medium Priority**
   - Attendance History
   - Profile Management
   - Offline support with Room

4. **Low Priority**
   - Advanced analytics
   - Push notifications
   - App settings

## ⚠️ Important Notes

- Minimum SDK 24 (Android 7.0)
- Target SDK 34 (Android 14)
- Requires Camera & Location permissions
- ML Kit Face Detection akan auto-download saat pertama kali digunakan
- Gunakan HTTPS di production
- Test face detection dengan lighting yang cukup

---

Untuk development lengkap, refer ke **ANDROID_GUIDE.md** untuk code examples dan best practices.

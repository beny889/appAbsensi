# Face Recognition Service

Microservice Python untuk ekstraksi face embeddings menggunakan `face_recognition` library (dlib).

## Features

- ✅ Face detection menggunakan dlib HOG detector
- ✅ 128-dimensional face embeddings
- ✅ Support base64 image input
- ✅ Face comparison dengan Euclidean distance
- ✅ REST API dengan Flask

## Requirements

- Python 3.8+
- CMake (untuk compile dlib)
- Visual C++ Build Tools (Windows) atau build-essential (Linux)

## Installation

### Windows

1. Install Visual C++ Build Tools dari:
   https://visualstudio.microsoft.com/visual-cpp-build-tools/

2. Install CMake:
   ```bash
   choco install cmake
   ```
   atau download dari: https://cmake.org/download/

3. Install dependencies:
   ```bash
   cd face-recognition-service
   pip install -r requirements.txt
   ```

### Linux/Mac

```bash
# Install build tools
sudo apt-get install build-essential cmake  # Ubuntu/Debian
brew install cmake  # macOS

# Install Python dependencies
cd face-recognition-service
pip install -r requirements.txt
```

## Usage

### Start Server

```bash
python app.py
```

Server akan berjalan di `http://localhost:5000`

### API Endpoints

#### 1. Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "Face Recognition Service",
  "version": "1.0.0"
}
```

#### 2. Extract Face Embedding

```bash
POST /extract-embedding
Content-Type: application/json

{
  "image": "base64_encoded_image_string"
}
```

Response:
```json
{
  "success": true,
  "embedding": [0.1, -0.2, 0.3, ...],
  "face_locations": [[top, right, bottom, left]],
  "embedding_size": 128
}
```

#### 3. Compare Faces

```bash
POST /compare-faces
Content-Type: application/json

{
  "embedding1": [0.1, -0.2, ...],
  "embedding2": [0.15, -0.18, ...]
}
```

Response:
```json
{
  "success": true,
  "similarity": 0.85,
  "distance": 0.15,
  "is_match": true,
  "tolerance": 0.6
}
```

## Integration with Backend

Backend NestJS akan call service ini untuk:
1. **Registrasi**: Extract embedding dari foto user
2. **Check In/Out**: Extract embedding dan compare dengan database

## Troubleshooting

### Windows: dlib installation fails

Install dlib pre-compiled wheel:
```bash
pip install https://github.com/jloh02/dlib/releases/download/v19.22/dlib-19.22.99-cp311-cp311-win_amd64.whl
```

### Face not detected

- Pastikan gambar cukup terang
- Wajah harus menghadap kamera
- Ukuran wajah minimal 15% dari total image

## Performance

- Face detection: ~100-500ms per image
- Embedding extraction: ~50-200ms per face
- Comparison: <1ms per pair

## Model Info

- **Detector**: dlib HOG (Histogram of Oriented Gradients)
- **Embeddings**: dlib ResNet-34 based model
- **Dimensions**: 128
- **Accuracy**: ~99.38% on LFW benchmark

# MobileFaceNet Model Setup

## Required File
Place the MobileFaceNet TFLite model in this folder with the name:
```
mobile_face_net.tflite
```

## Download Instructions

### Option 1: From TensorFlow Hub / GitHub
1. Search for "MobileFaceNet TFLite" on GitHub
2. Download a pre-trained model (~5MB)
3. Rename to `mobile_face_net.tflite`
4. Place in this `assets` folder

### Option 2: Convert from PyTorch/ONNX
If you have a PyTorch or ONNX MobileFaceNet model:
1. Convert to TFLite using TensorFlow Lite Converter
2. Ensure input shape is [1, 112, 112, 3] (NHWC format)
3. Ensure output shape is [1, 192] (192-dimensional embedding)

### Recommended Sources
- https://github.com/sirius-ai/MobileFaceNet_TF
- https://github.com/AlfredXiangWu/face_verification
- TensorFlow Hub face embedding models

## Model Specifications
- Input: 112x112 RGB image
- Output: 192-dimensional face embedding
- Normalized to unit vector (L2 norm = 1)
- Distance threshold: 1.0 (Euclidean distance)

## Notes
- The model file should NOT be compressed (already configured in build.gradle)
- Model size: approximately 3-5MB
- GPU acceleration supported via TFLite GPU delegate

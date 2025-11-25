"""
Face Recognition Service
========================
Microservice untuk ekstraksi face embeddings menggunakan face_recognition library (dlib).

API Endpoints:
- POST /extract-embedding: Extract face embedding dari base64 image
- GET /health: Health check endpoint
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
PORT = int(os.getenv('PORT', 5000))
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'Face Recognition Service',
        'version': '1.0.0'
    })


@app.route('/extract-embedding', methods=['POST'])
def extract_embedding():
    """
    Extract face embedding dari base64 image

    Request body:
    {
        "image": "base64_encoded_image_string"
    }

    Response:
    {
        "success": true,
        "embedding": [0.1, -0.2, 0.3, ...],  // 128-dimensional array
        "face_locations": [[top, right, bottom, left]]
    }
    """
    try:
        # Get request data
        data = request.get_json()

        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing image field in request body'
            }), 400

        base64_image = data['image']

        # Remove data URI prefix if exists (data:image/jpeg;base64,...)
        if 'base64,' in base64_image:
            base64_image = base64_image.split('base64,')[1]

        # Decode base64 to image
        try:
            image_data = base64.b64decode(base64_image)
            image = Image.open(BytesIO(image_data))

            # Convert to RGB if needed (face_recognition requires RGB)
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Convert PIL Image to numpy array
            image_array = np.array(image)

        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Invalid base64 image: {str(e)}'
            }), 400

        # Detect face locations
        face_locations = face_recognition.face_locations(image_array, model='hog')

        if len(face_locations) == 0:
            return jsonify({
                'success': False,
                'error': 'No face detected in the image'
            }), 400

        if len(face_locations) > 1:
            return jsonify({
                'success': False,
                'error': f'Multiple faces detected ({len(face_locations)}). Please ensure only one face is in the image.'
            }), 400

        # Extract face encodings (128-dimensional embeddings)
        face_encodings = face_recognition.face_encodings(image_array, face_locations)

        if len(face_encodings) == 0:
            return jsonify({
                'success': False,
                'error': 'Could not generate face encoding'
            }), 400

        # Get the first (and only) face encoding
        face_embedding = face_encodings[0]

        # Convert numpy array to list for JSON serialization
        embedding_list = face_embedding.tolist()

        return jsonify({
            'success': True,
            'embedding': embedding_list,
            'face_locations': face_locations,
            'embedding_size': len(embedding_list)
        }), 200

    except Exception as e:
        app.logger.error(f'Error extracting embedding: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500


@app.route('/compare-faces', methods=['POST'])
def compare_faces():
    """
    Compare two face embeddings

    Request body:
    {
        "embedding1": [0.1, -0.2, ...],  // 128-dimensional array
        "embedding2": [0.15, -0.18, ...]  // 128-dimensional array
    }

    Response:
    {
        "success": true,
        "similarity": 0.85,
        "distance": 0.15,
        "is_match": true
    }
    """
    try:
        data = request.get_json()

        if not data or 'embedding1' not in data or 'embedding2' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing embedding1 or embedding2 in request body'
            }), 400

        # Convert to numpy arrays
        embedding1 = np.array(data['embedding1'])
        embedding2 = np.array(data['embedding2'])

        # Validate dimensions
        if len(embedding1) != 128 or len(embedding2) != 128:
            return jsonify({
                'success': False,
                'error': 'Embeddings must be 128-dimensional'
            }), 400

        # Calculate Euclidean distance
        distance = np.linalg.norm(embedding1 - embedding2)

        # Convert distance to similarity (0 to 1, where 1 is identical)
        # Typical face recognition threshold is 0.6 distance
        similarity = max(0, 1 - (distance / 1.2))  # Normalize to 0-1 range

        # face_recognition default threshold is 0.6
        tolerance = 0.6
        is_match = distance <= tolerance

        return jsonify({
            'success': True,
            'similarity': float(similarity),
            'distance': float(distance),
            'is_match': bool(is_match),
            'tolerance': tolerance
        }), 200

    except Exception as e:
        app.logger.error(f'Error comparing faces: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500


if __name__ == '__main__':
    print(f"""
    ================================================
       Face Recognition Service
       Running on http://localhost:{PORT}
    ================================================
    """)
    app.run(host='0.0.0.0', port=PORT, debug=DEBUG)

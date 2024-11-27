import os
from flask import Flask, render_template, request, jsonify
import requests
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "a secret key"
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///tts.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
db.init_app(app)

ELEVEN_LABS_API_KEY = os.environ.get("ELEVEN_LABS_API_KEY", "your-api-key")
ELEVEN_LABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Default voice ID

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert_text():
    # Check if API key is set
    if not ELEVEN_LABS_API_KEY or ELEVEN_LABS_API_KEY == "your-api-key":
        return jsonify({
            'error': 'API key not configured',
            'message': 'Please configure a valid ElevenLabs API key'
        }), 401

    # Validate input text
    text = request.json.get('text')
    if not text:
        return jsonify({
            'error': 'validation_error',
            'message': 'No text provided'
        }), 400
    
    if len(text) > 5000:
        return jsonify({
            'error': 'validation_error',
            'message': 'Text exceeds maximum length of 5000 characters'
        }), 400

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVEN_LABS_VOICE_ID}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVEN_LABS_API_KEY
    }

    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }

    try:
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            return response.content, 200, {'Content-Type': 'audio/mpeg'}
        
        # Handle specific error cases
        error_messages = {
            401: {
                'error': 'unauthorized',
                'message': 'Invalid API key. Please check your ElevenLabs API key'
            },
            429: {
                'error': 'rate_limit',
                'message': 'Rate limit exceeded. Please try again later'
            },
            400: {
                'error': 'bad_request',
                'message': 'Invalid request parameters'
            },
            403: {
                'error': 'forbidden',
                'message': 'Access denied. Please check your subscription'
            }
        }
        
        error_response = error_messages.get(
            response.status_code,
            {
                'error': 'api_error',
                'message': f'API request failed: {response.text}'
            }
        )
        
        return jsonify(error_response), response.status_code
        
    except requests.exceptions.RequestException as e:
        return jsonify({
            'error': 'network_error',
            'message': 'Failed to connect to the API service'
        }), 503
    except Exception as e:
        return jsonify({
            'error': 'server_error',
            'message': 'An unexpected error occurred'
        }), 500

with app.app_context():
    db.create_all()

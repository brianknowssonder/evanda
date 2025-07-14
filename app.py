from flask import Flask, jsonify, request, g
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message
import re
from functools import wraps
from datetime import datetime, timedelta
import base64
import jwt
import qrcode
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from werkzeug.utils import secure_filename
from flask_cors import CORS

import traceback
from itsdangerous import URLSafeTimedSerializer
import hashlib
import json
import requests
from requests.auth import HTTPBasicAuth
import os
import ssl
from flask_talisman import Talisman
import logging
from logging.handlers import RotatingFileHandler
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import numpy.typing as npt
# ...existing code...
from jwt.exceptions import InvalidTokenError


# ======================
# MANUAL CONFIGURATION
# ======================

# Flask Configuration
app = Flask(__name__)
ALLOWED_ORIGINS = ["http://localhost:5000", "http://localhost:5173"]
CORS(
    app,
    resources={
        r"/*": {
            "origins": ALLOWED_ORIGINS,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "expose_headers": ["Content-Type"]
        }
    }
)

app.config.update(
    SECRET_KEY='BRIAN@Og0pa',  # Replace with a strong secret key
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=30),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_REFRESH_EACH_REQUEST=True,
    DEBUG=True,
    ENV='development'
)

# Database Configuration
db_config = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': '',  # Replace with your actual DB password
    'database': 'evanda_ticketing',
    'port': 3306,
    'pool_name': 'evanda_pool',
    'pool_size': 5,
    'pool_reset_session': True,
    'raise_on_warnings': True
}

# Email Configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'mwangibrianmwaura@gmail.com'
app.config['MAIL_PASSWORD'] = 'BRIAN@Og0pa'  # Replace with actual app password
app.config['MAIL_DEFAULT_SENDER'] = 'mwangibrianmwaura@gmail.com'

# MPesa Configuration
MPESA_CONSUMER_KEY = 'LAdpMjBWf8al0weJQ5PFO9lQYLAl4uyuO6YGvTbUPW2uLegk'
MPESA_CONSUMER_SECRET = 'TXDVjoiOHysydT3ansdmAb6nIhaeNNnMrYHByNnOsIpDG08NJdalnA98ZKElseT6'
MPESA_PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
MPESA_BUSINESS_SHORTCODE = '174379'

# ======================
# SECURITY CONFIGURATION
# ======================

# Security headers and HTTPS enforcement
csp = {
    'default-src': "'self'",
    'script-src': [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.jsdelivr.net"
    ],
    'style-src': [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
    ],
    'font-src': [
        "'self'",
        "https://fonts.gstatic.com"
    ],
    'img-src': [
        "'self'",
        "data:",
        "https://*.pythonanywhere.com"
    ]
}
Talisman(
    app,
    force_https=True,
    strict_transport_security=True,
    content_security_policy=csp,
    content_security_policy_nonce_in=['script-src'],
    frame_options='SAMEORIGIN',
    referrer_policy='strict-origin-when-cross-origin',
    feature_policy={
        'geolocation': '\'none\'',
    },
    session_cookie_secure=True,
    session_cookie_http_only=True,
    permissions_policy=None,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
handler = RotatingFileHandler('evanda.log', maxBytes=1000000, backupCount=5)
handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
app.logger.addHandler(handler)

# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    # storage_uri="memory://"
)

# Initialize extensions
mail = Mail(app)
serializer = URLSafeTimedSerializer(app.secret_key)

# =================
# UTILITY FUNCTIONS
# =================

class DatabaseConnectionError(Exception):
    """Custom exception for database connection issues"""
    pass

class DatabaseConnectionError(Exception):
    """Custom exception for token related errors"""
    pass

def get_db_connection():
    """Get a database connection from the pool with error handling"""
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except mysql.connector.Error as err:
        app.logger.error(f"Database connection error: {err}")
        raise DatabaseConnectionError("Could not connect to database")

def validate_email(email):
    """Validate email format with regex"""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Validate Kenyan phone number format"""
    return phone.startswith(('07', '01')) and len(phone) == 10 and phone.isdigit()

def encode_auth_token(user_id, role):
    """Generate JWT token with enhanced security"""
    payload = {
        'exp': datetime.utcnow() + timedelta(days=1),
        'iat': datetime.utcnow(),
        'sub': user_id,
        'role': role,
        'iss': 'evanda-api',
        'aud': 'evanda-client'
    }
    token = jwt.encode({
    "sub": str(user_id),  # Ensure user_id is a string
    # ...other claims...
}, app.config["SECRET_KEY"], algorithm="HS256")
    return token

def decode_auth_token(token):
    """Decode and validate JWT token with comprehensive error handling"""
    try:
        payload = jwt.decode(
            token,
            app.secret_key,
            algorithms=['HS256'],
            issuer='evanda-api',
            audience='evanda-client'
        )
        return {'user_id': payload['sub'], 'role': payload['role']}
    except jwt.ExpiredSignatureError:
        raise InvalidTokenError('Token expired')
    except jwt.InvalidTokenError as e:
        raise InvalidTokenError(f'Invalid token: {str(e)}')

def role_required(*roles):
    """Decorator to check user roles with improved security"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                app.logger.warning("Missing authorization header")
                return jsonify({'message': 'Authorization header is missing'}), 401

            try:
                if not auth_header.startswith('Bearer '):
                    app.logger.warning("Invalid authorization header format")
                    return jsonify({'message': 'Invalid token format'}), 401

                token = auth_header.split()[1]
                decoded = decode_auth_token(token)

                if isinstance(decoded, str):
                    app.logger.warning(f"Token decode error: {decoded}")
                    return jsonify({'message': decoded}), 401

                if decoded['role'].lower() not in [r.lower() for r in roles]:
                    app.logger.warning(f"Role permission denied for {decoded['role']}")
                    return jsonify({'message': 'Forbidden: Insufficient role'}), 403

                g.user_id = decoded['user_id']
                g.user_role = decoded['role']
                return f(*args, **kwargs)
            except InvalidTokenError as e:
                app.logger.warning(f"Token validation error: {str(e)}")
                return jsonify({'message': str(e)}), 401
            except Exception as e:
                app.logger.error(f"Unexpected error in role_required: {str(e)}")
                return jsonify({'message': 'Authentication failed'}), 500
        return wrapper
    return decorator

def generate_pdf(ticket, user_name, qr_binary, event_date):
    """Generate PDF ticket with enhanced security features"""
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Security features
    c.setFont("Helvetica", 4)
    c.setFillColor(colors.HexColor('#E0E0E0'))
    for i in range(0, int(width), 5):
        for j in range(0, int(height), 5):
            c.drawString(i, j, "EVANDA")

    # Ticket container
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor('#6C757D'))
    c.setLineWidth(2)
    c.roundRect(50, 300, 500, 400, 10, fill=1, stroke=1)

    # Security warning
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(colors.red)
    c.drawRightString(width - 60, 720, "SECURITY DOCUMENT - DO NOT COPY")

    # Header with brand colors
    c.setFillColor(colors.HexColor('#6C757D'))
    c.roundRect(50, 650, 500, 50, 10, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(colors.white)
    c.drawCentredString(width / 2, 665, "EVANDA TICKET")

    # Event details
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(colors.HexColor('#495057'))
    c.drawString(70, 620, "EVENT DETAILS")
    c.setFont("Helvetica", 12)
    event_date_str = event_date.strftime('%B %d, %Y at %I:%M %p')
    c.drawString(70, 585, f"🎭 Event: {ticket['event_name']}")
    c.drawString(70, 560, f"📍 Venue: {ticket['event_location']}")
    c.drawString(70, 535, f"📅 Date: {event_date_str}")

    # Ticket holder info
    c.setFont("Helvetica-Bold", 14)
    c.drawString(70, 495, "TICKET HOLDER")
    c.setFont("Helvetica", 12)
    c.drawString(70, 470, f"👤 Name: {user_name}")
    c.drawString(70, 445, f"🎫 Type: {ticket['ticket_name']}")
    c.drawString(70, 420, f"💰 Price: Ksh {ticket['price']:.2f}")
    c.drawString(70, 395, f"🆔 Ticket ID: {ticket['id']}")

    # QR Code
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor('#6C757D'))
    c.setLineWidth(1.5)
    c.roundRect(370, 400, 150, 150, 5, fill=1, stroke=1)
    c.drawImage(ImageReader(BytesIO(qr_binary)), 380, 410, width=130, height=130)

    # Footer
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(colors.HexColor('#6C757D'))
    c.drawString(70, 370, "This ticket must be presented at the event entrance.")
    c.drawString(70, 355, "Contact: evandatickets@gmail.com for any questions.")

    c.showPage()
    c.save()
    return buffer

# ================
# ERROR HANDLERS
# ================

@app.errorhandler(400)
def bad_request(error):
    app.logger.warning(f"Bad request: {str(error)}")
    return jsonify({
        'error': 'Bad request',
        'message': 'The server could not understand the request'
    }), 400

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'error': 'Unauthorized',
        'message': 'Authentication is required'
    }), 401

@app.errorhandler(403)
def forbidden(error):
    return jsonify({
        'error': 'Forbidden',
        'message': 'You do not have permission to access this resource'
    }), 403

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Not found',
        'message': 'The requested resource was not found'
    }), 404

@app.errorhandler(429)
def ratelimit_handler(error):
    return jsonify({
        'error': 'Too many requests',
        'message': 'You have exceeded your request limit'
    }), 429

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500

# =================
# API ENDPOINTS
# =================
@app.route('/env-check')
def env_check():
    return jsonify({
        'FLASK_ENV': 'development',
        'DB_HOST': True,
        'MAIL_SERVER': 'smtp.gmail.com'
    })

@app.route('/health', methods=['GET'])
@limiter.limit("10 per minute")
def health_check():
    """Endpoint for service health monitoring"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()

        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected',
            'version': '1.0.0'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'database': 'disconnected'
        }), 500

@app.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    """User registration endpoint with enhanced validation"""
    try:
        data = request.get_json()
        if not data:
            app.logger.warning("No data provided in registration")
            return jsonify({'message': 'No data provided'}), 400

        required_fields = ['name', 'email', 'password', 'phone_number']
        if not all(field in data for field in required_fields):
            missing = [f for f in required_fields if f not in data]
            app.logger.warning(f"Missing fields in registration: {missing}")
            return jsonify({'message': f'Missing required fields: {missing}'}), 400

        if not validate_email(data['email']):
            app.logger.warning(f"Invalid email format: {data['email']}")
            return jsonify({'message': 'Invalid email format'}), 400

        if not validate_phone(data['phone_number']):
            app.logger.warning(f"Invalid phone format: {data['phone_number']}")
            return jsonify({'message': 'Phone must be 10 digits starting with 07 or 01'}), 400

        if len(data['password']) < 8:
            return jsonify({'message': 'Password must be at least 8 characters'}), 400
        if not any(c.isupper() for c in data['password']):
            return jsonify({'message': 'Password must contain at least one uppercase letter'}), 400
        if not any(c.isdigit() for c in data['password']):
            return jsonify({'message': 'Password must contain at least one digit'}), 400

        international_phone = '254' + data['phone_number'][1:]
        hashed_password = generate_password_hash(data['password'])

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id FROM users WHERE email = %s", (data['email'],))
        if cursor.fetchone():
            app.logger.warning(f"Duplicate registration attempt for email: {data['email']}")
            return jsonify({'message': 'Email already registered'}), 409

        cursor.execute("""
            INSERT INTO users (name, email, password_hash, phone_number, profile_picture_url)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            data['name'],
            data['email'],
            hashed_password,
            international_phone,
            data.get('profile_picture_url')
        ))
        user_id = cursor.lastrowid
        conn.commit()

        try:
            msg = Message(
                subject="Welcome to EVANDA",
                recipients=[data['email']],
                html=f"""
                <html>
                    <body>
                        <h2>Welcome {data['name']}!</h2>
                        <p>Thank you for registering with EVANDA.</p>
                        <p>Your account has been successfully created.</p>
                        <p>If you did not request this, please contact support immediately.</p>
                    </body>
                </html>
                """
            )
            mail.send(msg)
        except Exception as e:
            app.logger.error(f"Failed to send welcome email: {str(e)}")

        token = encode_auth_token(user_id, 'customer')
        return jsonify({
            'message': 'Registration successful',
            'token': token,
            'user_id': user_id
        }), 201

    except mysql.connector.Error as db_error:
        app.logger.error(f"Database error during registration: {db_error}")
        return jsonify({'message': 'Database operation failed'}), 500
    except Exception as e:
        app.logger.error(f"Unexpected error during registration: {str(e)}")
        return jsonify({'message': 'Registration failed'}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/login', methods=['POST', 'OPTIONS'])
@limiter.limit("10 per minute")
def login():
    """User login endpoint with brute force protection"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'Preflight request accepted'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            app.logger.warning("Missing email or password in login attempt")
            return jsonify({'message': 'Email and password required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id, password_hash, role, login_attempts, last_login_attempt
            FROM users
            WHERE email = %s
        """, (data['email'],))
        user = cursor.fetchone()

        if not user:
            app.logger.warning(f"Login attempt for non-existent email: {data['email']}")
            return jsonify({'message': 'Invalid credentials'}), 401

        if user.get('login_attempts', 0) >= 5:
            last_attempt = user.get('last_login_attempt')
            if last_attempt and (datetime.now() - last_attempt) < timedelta(minutes=30):
                app.logger.warning(f"Account locked for email: {data['email']}")
                return jsonify({
                    'message': 'Account locked. Try again later or reset password.'
                }), 403

        if not check_password_hash(user['password_hash'], data['password']):
            cursor.execute("""
                UPDATE users
                SET login_attempts = login_attempts + 1,
                    last_login_attempt = NOW()
                WHERE email = %s
            """, (data['email'],))
            conn.commit()

            app.logger.warning(f"Failed login attempt for email: {data['email']}")
            return jsonify({'message': 'Invalid credentials'}), 401

        cursor.execute("""
            UPDATE users
            SET login_attempts = 0,
                last_login_attempt = NULL,
                last_login = NOW()
            WHERE email = %s
        """, (data['email'],))
        conn.commit()

        token = encode_auth_token(user['id'], user['role'])
        return jsonify({
            'token': token,
            'user_id': user['id'],
            'role': user['role']
        }), 200

    except Exception as e:
        app.logger.error(f"Login error: {str(e)}")
        return jsonify({'message': 'Login failed'}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/request-password-reset', methods=['POST'])
@limiter.limit("3 per hour")
def request_password_reset():
    """Handle password reset requests"""
    try:
        email = request.json.get('email')
        if not email or not validate_email(email):
            return jsonify({'message': 'Valid email required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'If an account exists, a reset link has been sent'}), 200

        token = serializer.dumps(email, salt='password-reset')
        reset_link = f"https://yourdomain.com/reset-password?token={token}"

        cursor.execute("""
            INSERT INTO PasswordResetTokens (user_id, token, expires_at)
            VALUES (%s, %s, DATE_ADD(NOW(), INTERVAL 1 HOUR))
        """, (user['id'], token))
        conn.commit()

        try:
            msg = Message(
                subject="EVANDA Password Reset",
                recipients=[email],
                html=f"""
                <html>
                    <body>
                        <h2>Password Reset Request</h2>
                        <p>Click the link below to reset your password:</p>
                        <p><a href="{reset_link}">{reset_link}</a></p>
                        <p>This link expires in 1 hour.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </body>
                </html>
                """
            )
            mail.send(msg)
        except Exception as e:
            app.logger.error(f"Failed to send password reset email: {str(e)}")
            return jsonify({'message': 'Failed to send reset email'}), 500

        return jsonify({'message': 'Reset link sent if email exists'}), 200

    except Exception as e:
        app.logger.error(f"Password reset error: {str(e)}")
        return jsonify({'message': 'Password reset failed'}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/reset-password', methods=['POST'])
@limiter.limit("5 per hour")
def reset_password():
    """Handle password reset"""
    try:
        token = request.json.get('token')
        new_password = request.json.get('new_password')

        if not token or not new_password:
            return jsonify({'message': 'Token and new password required'}), 400

        try:
            email = serializer.loads(
                token,
                salt='password-reset',
                max_age=3600
            )
        except:
            return jsonify({'message': 'Invalid or expired token'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT user_id
            FROM PasswordResetTokens
            WHERE token = %s AND expires_at > NOW() AND used = 0
        """, (token,))
        valid_token = cursor.fetchone()

        if not valid_token:
            return jsonify({'message': 'Invalid or expired token'}), 400

        hashed_password = generate_password_hash(new_password)
        cursor.execute("""
            UPDATE Users
            SET password_hash = %s,
                login_attempts = 0
            WHERE email = %s
        """, (hashed_password, email))

        cursor.execute("""
            UPDATE PasswordResetTokens
            SET used = 1
            WHERE token = %s
        """, (token,))

        conn.commit()
        return jsonify({'message': 'Password updated successfully'}), 200

    except Exception as e:
        app.logger.error(f"Password reset error: {str(e)}")
        return jsonify({'message': 'Password reset failed'}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

# User Management Endpoints
@app.route('/users', methods=['GET'])
@role_required('admin')
def get_all_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email, role, profile_picture_url, created_at FROM Users")
        users = cursor.fetchall()
        return jsonify({'users': users}), 200
    except Exception as e:
        app.logger.error(f"Error getting all users: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/users/<int:user_id>', methods=['GET'])
@role_required('admin')
def get_user(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email, role, profile_picture_url, created_at FROM Users WHERE id = %s", (user_id,))
        user = cursor.fetchone()

        if user:
            return jsonify({'user': user}), 200
        else:
            return jsonify({'message': 'User not found'}), 404

    except Exception as e:
        app.logger.error(f"Error getting user {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/users/<int:user_id>', methods=['PUT'])
@role_required('admin')
def update_user(user_id):
    data = request.json
    name = data.get('name')
    email = data.get('email')
    phone_number = data.get('phone_number')
    profile_picture_url = data.get('profile_picture_url')

    if not any([name, email, phone_number, profile_picture_url]):
        return jsonify({'message': 'At least one field must be provided for update.'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM Users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({'message': 'User not found'}), 404

        fields = []
        values = []

        if name:
            fields.append("name = %s")
            values.append(name)
        if email:
            if not validate_email(email):
                return jsonify({'message': 'Invalid email format'}), 400
            fields.append("email = %s")
            values.append(email)
        if phone_number:
            if not validate_phone(phone_number):
                return jsonify({'message': 'Phone number must be 10 digits and start with 07 or 01.'}), 400
            international_phone = '254' + phone_number[1:]
            fields.append("phone_number = %s")
            values.append(international_phone)
        if profile_picture_url:
            fields.append("profile_picture_url = %s")
            values.append(profile_picture_url)

        values.append(user_id)

        query = f"UPDATE Users SET {', '.join(fields)} WHERE id = %s"
        cursor.execute(query, values)
        conn.commit()

        return jsonify({'message': 'User updated successfully'}), 200

    except Exception as e:
        app.logger.error(f"Error updating user {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/users/<int:user_id>', methods=['DELETE'])
@role_required('admin')
def delete_user(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM Users WHERE id = %s", (user_id,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'User not found.'}), 404

        cursor.execute("DELETE FROM Users WHERE id = %s", (user_id,))
        conn.commit()

        return jsonify({'message': 'User deleted successfully.'}), 200

    except Exception as e:
        app.logger.error(f"Error deleting user {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/toggle-organizer/<int:user_id>', methods=['PATCH'])
@role_required('admin')
def toggle_organizer(user_id):
    data = request.get_json()
    role_action = data.get('role_action')

    if role_action not in ['on', 'off']:
        return jsonify({'error': 'role_action must be "on" or "off"'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM Users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        new_role = 'organizer' if role_action == 'on' else 'customer'
        cursor.execute("UPDATE Users SET role = %s WHERE id = %s", (new_role, user_id))
        conn.commit()

        return jsonify({'message': f'User {user_id} role set to {new_role}'}), 200

    except Exception as e:
        app.logger.error(f"Error toggling organizer role for user {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Event Management Endpoints
@app.route('/events', methods=['POST'])
@role_required('organizer', 'admin')
def create_event():
    try:
        data = request.json
        user_id = g.user_id
        title = data.get('title')
        description = data.get('description')
        location = data.get('location')
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if not all([title, start_time, end_time]):
            return jsonify({'message': 'Title, start_time, and end_time are required.'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            INSERT INTO Events (organizer_id, title, description, location, start_time, end_time)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (user_id, title, description, location, start_time, end_time))

        event_id = cursor.lastrowid
        conn.commit()

        return jsonify({
            'message': 'Event created successfully.',
            'event_id': event_id
        }), 201

    except Exception as e:
        app.logger.error(f"Error creating event: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/events', methods=['GET'])
def get_all_events():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                e.id, e.title, e.description, e.location,
                e.start_time, e.end_time, e.organizer_id, u.name AS organizer_name
            FROM Events e
            JOIN Users u ON e.organizer_id = u.id
            ORDER BY e.start_time ASC
        """)

        events = cursor.fetchall()
        return jsonify({'events': events}), 200

    except Exception as e:
        app.logger.error(f"Error getting all events: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/events/<int:event_id>', methods=['GET'])
def get_event_by_id(event_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                e.id, e.title, e.description, e.location,
                e.start_time, e.end_time, e.organizer_id, u.name AS organizer_name
            FROM Events e
            JOIN Users u ON e.organizer_id = u.id
            WHERE e.id = %s
        """, (event_id,))

        event = cursor.fetchone()
        if not event:
            return jsonify({'message': 'Event not found'}), 404

        return jsonify({'event': event}), 200

    except Exception as e:
        app.logger.error(f"Error getting event {event_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/events/<int:event_id>', methods=['PUT'])
@role_required('organizer', 'admin')
def update_event(event_id):
    data = request.json
    title = data.get('title')
    description = data.get('description')
    location = data.get('location')
    start_time = data.get('start_time')
    end_time = data.get('end_time')

    if not title or not start_time or not end_time:
        return jsonify({'message': 'Title, start_time, and end_time are required.'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT organizer_id FROM Events WHERE id = %s", (event_id,))
        event = cursor.fetchone()
        if not event:
            return jsonify({'message': 'Event not found.'}), 404
        if event['organizer_id'] != g.user_id and g.user_role != 'admin':
            return jsonify({'message': 'Unauthorized to update this event'}), 403

        cursor.execute("""
            UPDATE Events
            SET title=%s, description=%s, location=%s,
                start_time=%s, end_time=%s, updated_at=NOW()
            WHERE id=%s
        """, (title, description, location, start_time, end_time, event_id))

        conn.commit()
        return jsonify({'message': 'Event updated successfully.'}), 200

    except Exception as e:
        app.logger.error(f"Error updating event {event_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/events/<int:event_id>', methods=['DELETE'])
@role_required('organizer', 'admin')
def delete_event(event_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT organizer_id FROM Events WHERE id = %s", (event_id,))
        event = cursor.fetchone()

        if not event:
            return jsonify({'message': 'Event not found.'}), 404
        if event['organizer_id'] != g.user_id and g.user_role != 'admin':
            return jsonify({'message': 'Unauthorized to delete this event'}), 403

        cursor.execute("DELETE FROM Events WHERE id = %s", (event_id,))
        conn.commit()

        return jsonify({'message': 'Event deleted successfully.'}), 200

    except Exception as e:
        app.logger.error(f"Error deleting event {event_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Ticket Management Endpoints
@app.route('/events/<int:event_id>/tickets', methods=['POST'])
@role_required('organizer', 'admin')
def create_ticket_for_event(event_id):
    data = request.json
    name = data.get('name')
    price = data.get('price')
    quantity_available = data.get('quantity_available')
    expiry_date = data.get('expiry_date')

    if not name or price is None or quantity_available is None:
        return jsonify({'message': 'Name, price, and quantity_available are required.'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT organizer_id FROM Events WHERE id = %s", (event_id,))
        event = cursor.fetchone()
        if not event:
            return jsonify({'message': 'Event not found.'}), 404
        if event['organizer_id'] != g.user_id and g.user_role != 'admin':
            return jsonify({'message': 'Unauthorized to create tickets for this event'}), 403

        cursor.execute("""
            INSERT INTO Tickets (event_id, name, price, quantity_available, expiry_date)
            VALUES (%s, %s, %s, %s, %s)
        """, (event_id, name, price, quantity_available, expiry_date))

        ticket_id = cursor.lastrowid
        conn.commit()

        return jsonify({
            'message': 'Ticket created successfully.',
            'ticket_id': ticket_id
        }), 201

    except Exception as e:
        app.logger.error(f"Error creating ticket for event {event_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/tickets/<int:ticket_id>', methods=['GET'])
def get_ticket_details(ticket_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT t.*, e.title AS event_name, u.name AS organizer_name
            FROM Tickets t
            JOIN Events e ON t.event_id = e.id
            JOIN Users u ON e.organizer_id = u.id
            WHERE t.id = %s
        """, (ticket_id,))
        ticket = cursor.fetchone()

        if not ticket:
            return jsonify({'message': 'Ticket not found.'}), 404

        return jsonify(ticket), 200

    except Exception as e:
        app.logger.error(f"Error getting ticket {ticket_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/tickets/<int:ticket_id>', methods=['PUT'])
@role_required('organizer', 'admin')
def update_ticket(ticket_id):
    data = request.json
    name = data.get('name')
    price = data.get('price')
    quantity_available = data.get('quantity_available')
    status = data.get('status')
    expiry_date = data.get('expiry_date')

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT t.*, e.organizer_id
            FROM Tickets t
            JOIN Events e ON t.event_id = e.id
            WHERE t.id = %s
        """, (ticket_id,))
        ticket = cursor.fetchone()

        if not ticket:
            return jsonify({'message': 'Ticket not found.'}), 404
        if ticket['organizer_id'] != g.user_id and g.user_role != 'admin':
            return jsonify({'message': 'Unauthorized to update this ticket'}), 403

        cursor.execute("""
            UPDATE Tickets
            SET name = %s,
                price = %s,
                quantity_available = %s,
                status = %s,
                expiry_date = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (
            name or ticket['name'],
            price or ticket['price'],
            quantity_available or ticket['quantity_available'],
            status or ticket['status'],
            expiry_date or ticket['expiry_date'],
            ticket_id
        ))

        conn.commit()
        return jsonify({'message': 'Ticket updated successfully.'}), 200

    except Exception as e:
        app.logger.error(f"Error updating ticket {ticket_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Order Management Endpoints
@app.route('/orders', methods=['POST'])
@role_required('customer', 'admin')
def create_order():
    data = request.json
    user_id = g.user_id
    items = data.get('items')

    if not items:
        return jsonify({'message': 'Items are required.'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        total_amount = 0
        event_id = None
        event_name = None

        for item in items:
            ticket_id = item.get('ticket_id')
            quantity = item.get('quantity')

            if not ticket_id or not quantity:
                return jsonify({'message': 'Each item must have ticket_id and quantity.'}), 400

            cursor.execute("""
                SELECT t.*, e.id AS event_id, e.title AS event_name
                FROM Tickets t
                JOIN Events e ON t.event_id = e.id
                WHERE t.id = %s AND t.status = 'active'
            """, (ticket_id,))
            ticket = cursor.fetchone()

            if not ticket:
                return jsonify({'message': f'Ticket {ticket_id} not found or inactive.'}), 404

            if ticket['quantity_available'] < quantity:
                return jsonify({'message': f'Not enough tickets available for {ticket["event_name"]}.'}), 400

            total_amount += ticket['price'] * quantity
            event_id = ticket['event_id']
            event_name = ticket['event_name']

        cursor.execute("""
            INSERT INTO Orders (user_id, order_status, total_amount)
            VALUES (%s, %s, %s)
        """, (user_id, 'pending', total_amount))
        order_id = cursor.lastrowid

        for item in items:
            ticket_id = item['ticket_id']
            quantity = item['quantity']

            cursor.execute("SELECT price FROM Tickets WHERE id = %s", (ticket_id,))
            ticket_price = cursor.fetchone()['price']
            subtotal = ticket_price * quantity

            cursor.execute("""
                INSERT INTO Order_Items (order_id, ticket_id, quantity, price_at_purchase, subtotal)
                VALUES (%s, %s, %s, %s, %s)
            """, (order_id, ticket_id, quantity, ticket_price, subtotal))

            cursor.execute("""
                UPDATE Tickets
                SET quantity_available = quantity_available - %s,
                    quantity_sold = quantity_sold + %s
                WHERE id = %s
            """, (quantity, quantity, ticket_id))

        cursor.execute("""
            SELECT SUM(quantity_available) AS total_remaining
            FROM Tickets
            WHERE event_id = %s
        """, (event_id,))
        total_remaining = cursor.fetchone()['total_remaining']

        conn.commit()

        return jsonify({
            'message': f'Order created successfully for event: {event_name}. Tickets remaining: {total_remaining}',
            'order_id': order_id
        }), 201

    except Exception as e:
        app.logger.error(f"Error creating order: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/orders/<int:order_id>', methods=['GET'])
@role_required('customer', 'admin', 'organizer')
def get_order_details(order_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT o.*, u.name AS user_name, u.email AS user_email
            FROM Orders o
            JOIN Users u ON o.user_id = u.id
            WHERE o.id = %s
        """, (order_id,))
        order = cursor.fetchone()

        if not order:
            return jsonify({'message': 'Order not found.'}), 404

        if order['user_id'] != g.user_id and g.user_role not in ['admin', 'organizer']:
            return jsonify({'message': 'Unauthorized to view this order'}), 403

        cursor.execute("""
            SELECT
                oi.id, oi.ticket_id, t.name AS ticket_name,
                oi.quantity, oi.price_at_purchase, oi.subtotal,
                e.title AS event_name
            FROM Order_Items oi
            JOIN Tickets t ON oi.ticket_id = t.id
            JOIN Events e ON t.event_id = e.id
            WHERE oi.order_id = %s
        """, (order_id,))
        items = cursor.fetchall()

        order['items'] = items

        return jsonify(order), 200

    except Exception as e:
        app.logger.error(f"Error getting order {order_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/user/orders', methods=['GET'])
@role_required('customer', 'admin')
def get_user_orders():
    try:
        user_id = g.user_id
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                o.id AS order_id,
                o.total_amount,
                o.order_status,
                o.created_at,
                COUNT(oi.id) AS item_count
            FROM Orders o
            LEFT JOIN Order_Items oi ON o.id = oi.order_id
            WHERE o.user_id = %s
            GROUP BY o.id
            ORDER BY o.created_at DESC
        """, (user_id,))

        orders = cursor.fetchall()
        return jsonify({'orders': orders}), 200

    except Exception as e:
        app.logger.error(f"Error getting orders for user {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Payment Endpoints
@app.route('/api/mpesa_payment', methods=['POST'])
@role_required('customer', 'admin')
def mpesa_payment():
    if request.method == 'POST':
        amount = request.form['amount']
        phone = request.form['phone']

        consumer_key = MPESA_CONSUMER_KEY
        consumer_secret = MPESA_CONSUMER_SECRET

        api_URL = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        response = requests.get(api_URL, auth=HTTPBasicAuth(consumer_key, consumer_secret))
        data = response.json()
        access_token = "Bearer" + ' ' + data['access_token']

        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        passkey = MPESA_PASSKEY
        business_short_code = MPESA_BUSINESS_SHORTCODE
        data = business_short_code + passkey + timestamp
        encoded = base64.b64encode(data.encode())
        password = encoded.decode()

        payload = {
            "BusinessShortCode": business_short_code,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone,
            "PartyB": business_short_code,
            "PhoneNumber": phone,
            "CallBackURL": 'https://yourdomain.com/api/callback',
            "AccountReference": "EVANDA Tickets",
            "TransactionDesc": "Payment for Event Tickets"
        }

        headers = {
            "Authorization": access_token,
            "Content-Type": "application/json"
        }

        url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        response = requests.post(url, json=payload, headers=headers)

        if response.status_code == 200:
            return jsonify({
                "message": "MPESA prompt sent to your phone",
                "response": response.json()
            }), 200
        else:
            app.logger.error(f"MPESA payment failed: {response.text}")
            return jsonify({
                "error": "Failed to initiate payment",
                "details": response.text
            }), 400

# Ticket Generation Endpoints
@app.route('/generate-ticket', methods=['POST'])
@role_required('customer', 'admin')
def generate_ticket():
    try:
        data = request.get_json()
        user_id = g.user_id
        order_id = data.get("order_id")

        if not order_id:
            return jsonify({"status": "error", "message": "Missing order_id"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id, name, email FROM Users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        cursor.execute("""
            SELECT
                t.id, t.name AS ticket_name, t.price,
                e.title AS event_name, e.start_time AS event_date,
                e.location AS event_location, e.id AS event_id,
                o.id AS order_id, oi.id AS order_item_id
            FROM Orders o
            JOIN Order_Items oi ON oi.order_id = o.id
            JOIN Tickets t ON oi.ticket_id = t.id
            JOIN Events e ON t.event_id = e.id
            WHERE o.user_id = %s AND o.id = %s
              AND o.order_status = 'paid'
              AND oi.status = 'active'
        """, (user_id, order_id))
        tickets = cursor.fetchall()

        if not tickets:
            return jsonify({"status": "error", "message": "No valid paid tickets"}), 404

        attachments = []
        for ticket in tickets:
            try:
                validation_hash = hashlib.sha256(
                    f"{ticket['id']}{ticket['order_item_id']}{app.secret_key}".encode()
                ).hexdigest()

                cursor.execute("""
                    INSERT INTO TicketValidations (
                        ticket_id, order_item_id, event_id,
                        qr_hash, is_scanned
                    ) VALUES (%s, %s, %s, %s, FALSE)
                    ON DUPLICATE KEY UPDATE qr_hash = VALUES(qr_hash)
                """, (
                    ticket['id'],
                    ticket['order_item_id'],
                    ticket['event_id'],
                    validation_hash
                ))

                qr_data = {
                    "ticket_id": ticket['id'],
                    "order_item_id": ticket['order_item_id'],
                    "hash": validation_hash
                }
                qr = qrcode.make(json.dumps(qr_data))
                qr_buffer = BytesIO()
                qr.save(qr_buffer, format='PNG')
                qr_binary = qr_buffer.getvalue()

                pdf_buffer = generate_pdf(
                    ticket=ticket,
                    user_name=user['name'],
                    qr_binary=qr_binary,
                    event_date=ticket['event_date']
                )
                attachments.append({
                    "filename": f"EVANDA_Ticket_{ticket['id']}.pdf",
                    "data": pdf_buffer.getvalue()
                })

                conn.commit()
            except Exception as e:
                conn.rollback()
                app.logger.error(f"Ticket {ticket['id']} error: {str(e)}")
                continue

        if attachments:
            msg = Message(
                subject="Your EVANDA Tickets",
                recipients=[user['email']],
                html=f"""
                <html>
                    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa;">
                        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <h2 style="color: #495057; margin-bottom: 5px;">EVANDA Tickets</h2>
                                <div style="height: 2px; background: #e9ecef; margin: 15px 0;"></div>
                            </div>
                            <h3 style="color: #212529; margin-top: 0;">Hello {user['name']},</h3>
                            <p style="color: #495057; line-height: 1.6;">Thank you for your purchase! Your tickets are attached to this email.</p>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                                <p style="margin: 0; color: #212529; font-weight: 500;">Important:</p>
                                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #495057;">
                                    <li>Each ticket has a unique QR code for verification</li>
                                    <li>Present your ticket at the event entrance</li>
                                    <li>Tickets are non-transferable without authorization</li>
                                </ul>
                            </div>
                            <p style="color: #495057;">We look forward to seeing you at the event!</p>
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                                <p style="font-size: 13px; color: #868e96; margin-bottom: 5px;">EVANDA Ticket Services</p>
                                <p style="font-size: 13px; color: #868e96; margin: 0;">Email: <a href="mailto:evandatickets@gmail.com" style="color: #6c757d;">evandatickets@gmail.com</a></p>
                            </div>
                        </div>
                    </body>
                </html>
                """
            )
            for att in attachments:
                msg.attach(att["filename"], "application/pdf", att["data"])
            mail.send(msg)

        return jsonify({
            "status": "success",
            "message": f"{len(attachments)} tickets sent to {user['email']}",
            "user_id": user_id
        })

    except Exception as e:
        app.logger.error(f"Error generating tickets: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/validate-ticket', methods=['POST'])
def validate_ticket():
    conn = None
    cursor = None
    try:
        if not request.is_json:
            return jsonify({"valid": False, "reason": "Request must be JSON"}), 400

        raw_input = request.json.get("qr_data")
        scanner_id = request.json.get('scanner_id', 'unknown')

        if not raw_input:
            return jsonify({"valid": False, "reason": "Missing QR data"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True, buffered=True)

        cursor.execute("SELECT * FROM Scanners WHERE username = %s", (scanner_id,))
        scanner = cursor.fetchone()
        if not scanner:
            cursor.close()
            conn.close()
            return jsonify({"valid": False, "reason": "Unauthorized scanner"}), 403

        if len(raw_input) == 64 and all(c in '0123456789abcdef' for c in raw_input.lower()):
            cursor.execute("""
                SELECT ticket_id, order_item_id, event_id
                FROM TicketValidations
                WHERE qr_hash = %s
                LIMIT 1
            """, (raw_input,))
            db_record = cursor.fetchone()

            if not db_record:
                cursor.close()
                conn.close()
                return jsonify({"valid": False, "reason": "Ticket not found"}), 404

            qr_json = {
                "ticket_id": db_record['ticket_id'],
                "order_item_id": db_record['order_item_id'],
                "hash": raw_input,
                "event_id": db_record['event_id']
            }
        else:
            try:
                qr_data = raw_input.strip()
                missing_padding = len(qr_data) % 4
                if missing_padding:
                    qr_data += '=' * (4 - missing_padding)
                decoded = base64.b64decode(qr_data).decode('utf-8')
                qr_json = json.loads(decoded)
            except:
                try:
                    qr_json = json.loads(raw_input)
                except json.JSONDecodeError:
                    cursor.close()
                    conn.close()
                    return jsonify({
                        "valid": False,
                        "reason": "Invalid QR format",
                        "hint": "Provide either: 1) Raw 64-char hash, 2) Base64, or 3) JSON"
                    }), 400

        required_fields = {
            'ticket_id': int,
            'order_item_id': int,
            'hash': str
        }

        errors = []
        for field, field_type in required_fields.items():
            if field not in qr_json:
                errors.append(f"Missing field: {field}")
            elif not isinstance(qr_json[field], field_type):
                errors.append(f"Invalid type for {field}, expected {field_type.__name__}")
            elif field_type == str and len(qr_json[field]) != 64:
                errors.append("Invalid hash length (expected 64 chars)")

        if errors:
            cursor.close()
            conn.close()
            return jsonify({"valid": False, "reason": " | ".join(errors)}), 400

        cursor.execute("""
            SELECT
                tv.qr_hash, tv.is_scanned, e.start_time, e.end_time,
                e.title AS event_name, u.name AS user_name,
                o.order_status, oi.status AS item_status,
                e.id AS event_id
            FROM TicketValidations tv
            JOIN Events e ON tv.event_id = e.id
            JOIN Order_Items oi ON tv.order_item_id = oi.id
            JOIN Orders o ON oi.order_id = o.id
            JOIN Users u ON o.user_id = u.id
            WHERE tv.ticket_id = %s AND tv.order_item_id = %s
            FOR UPDATE
        """, (qr_json['ticket_id'], qr_json['order_item_id']))

        record = cursor.fetchone()

        if not record:
            cursor.close()
            conn.close()
            return jsonify({"valid": False, "reason": "Ticket not found"}), 404

        validation_errors = []
        event_status = "unknown"

        if record['qr_hash'] != qr_json['hash']:
            validation_errors.append("Security validation failed")

        if record['is_scanned']:
            validation_errors.append("Ticket already used")
        if record['order_status'] != 'paid':
            validation_errors.append("Payment not completed")
        if record['item_status'] != 'active':
            validation_errors.append("Ticket not active")

        try:
            start_time = record['start_time']
            end_time = record['end_time']
            current_time = datetime.now()

            if not isinstance(start_time, datetime):
                start_time = datetime.fromisoformat(str(start_time))
            if not isinstance(end_time, datetime):
                end_time = datetime.fromisoformat(str(end_time))

            if current_time < start_time:
                validation_errors.append(f"Event has not started yet. Starts at {start_time}")
                event_status = "not_started"
            elif current_time > end_time:
                validation_errors.append(f"Event has ended at {end_time}")
                event_status = "ended"
            else:
                event_status = "ongoing"
        except Exception as time_err:
            validation_errors.append(f"Time validation error: {str(time_err)}")
            event_status = "error"

        if validation_errors:
            cursor.close()
            conn.close()
            return jsonify({
                "valid": False,
                "reason": ", ".join(validation_errors),
                "status": event_status,
                "event_id": record.get('event_id')
            }), 400

        cursor.execute("""
            UPDATE TicketValidations
            SET is_scanned = TRUE,
                scan_time = NOW(),
                scanner_id = %s
            WHERE ticket_id = %s AND order_item_id = %s
        """, (scanner_id, qr_json['ticket_id'], qr_json['order_item_id']))

        cursor.execute("""
            UPDATE Scanners
            SET scan_count = scan_count + 1
            WHERE username = %s
        """, (scanner_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "valid": True,
            "status": event_status,
            "event": record['event_name'],
            "user": record['user_name'],
            "event_id": record['event_id'],
            "scanned_at": datetime.now().isoformat(),
            "scanner_id": scanner_id
        })

    except Exception as e:
        if conn:
            conn.rollback()
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        app.logger.error(f"Validation error: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({
            "valid": False,
            "reason": "Internal server error",
            "error_details": str(e)
        }), 500

# Scanner Management Endpoints
@app.route('/add-scanner', methods=['POST'])
@role_required('admin')
def add_scanner():
    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON data required"}), 400

    username = data.get('username')
    location = data.get('location')
    role = data.get('role')
    admin_email = data.get('admin_email', 'addictb729@gmail.com')

    if not username or not location or not role:
        return jsonify({"error": "Missing username, location, or role"}), 400

    token_data = {
        "username": username,
        "location": location,
        "role": role,
        "issued_at": datetime.utcnow().isoformat()
    }
    token = serializer.dumps(token_data)

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO Scanners (username, auth_qr_code, location, role)
            VALUES (%s, %s, %s, %s)
        """, (username, token, location, role))
        conn.commit()

    except mysql.connector.IntegrityError as err:
        if "Duplicate entry" in str(err):
            return jsonify({"error": "Scanner with this username already exists"}), 409
        return jsonify({"error": str(err)}), 500
    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(token)
    qr.make(fit=True)
    img = qr.make_image(fill='black', back_color='white')

    buffered = BytesIO()
    img.save(buffered, format="PNG")
    buffered.seek(0)
    qr_code_bytes = buffered.read()

    try:
        msg = Message(
            subject=f"New Scanner QR Code: {username}",
            recipients=[admin_email],
            body=f"A new scanner has been added.\n\nUsername: {username}\nLocation: {location}\nRole: {role}\n\nAttached is the QR code to authorize this scanner."
        )
        msg.attach(f"{username}_qr.png", "image/png", qr_code_bytes)
        mail.send(msg)
    except Exception as e:
        return jsonify({"message": "Scanner added but email failed", "error": str(e)}), 500

    return jsonify({
        "message": "Scanner added and QR code sent to admin email",
        "username": username
    })

if __name__ == '__main__':
    app.run(
        debug=True,
        port=5000
    )
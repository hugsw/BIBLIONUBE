from functools import wraps
from flask import request, jsonify, current_app
from firebase_admin import auth

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(None, *args, **kwargs)
        
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Formato de token inválido. Use "Bearer <token>".'}), 401
        
        if not token:
            return jsonify({'error': 'Token de autenticación es requerido.'}), 401
        
        try:
            decoded_token = auth.verify_id_token(token)
            current_user_id = decoded_token['uid'] 
        except auth.ExpiredIdTokenError:
            return jsonify({'error': 'El token ha expirado.'}), 401
        except auth.InvalidIdTokenError as e:
            current_app.logger.warning(f"Error de token inválido: {e}")
            return jsonify({'error': 'Token inválido.'}), 401
        except Exception as e:
            current_app.logger.error(f"Error desconocido al verificar token: {e}")
            return jsonify({'error': 'Error interno al verificar token.'}), 500
        return f(current_user_id, *args, **kwargs)
    return decorated
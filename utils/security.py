# utils/security.py
import jwt
from functools import wraps
from flask import request, jsonify, current_app

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
            # --- CAMBIO IMPORTANTE ---
            # Usamos 'current_app' para acceder a la config de la app
            # Esto evita problemas de importación circular
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data['id_usuario']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'El token ha expirado.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido.'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated
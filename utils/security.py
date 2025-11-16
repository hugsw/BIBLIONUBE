# utils/security.py (NUEVO CÓDIGO para Firebase)
import jwt
from functools import wraps
from flask import request, jsonify, current_app
from firebase_admin import auth # <--- Importamos la autenticación de Firebase

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(None, *args, **kwargs) # Maneja CORS preflight
        
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1] # Obtiene el token "Bearer <token>"
            except IndexError:
                return jsonify({'error': 'Formato de token inválido. Use "Bearer <token>".'}), 401
        
        if not token:
            return jsonify({'error': 'Token de autenticación es requerido.'}), 401
        
        try:
            # --- ¡LA MAGIA OCURRE AQUÍ! ---
            # Le preguntamos a Firebase si este token es válido
            decoded_token = auth.verify_id_token(token)
            
            # Pasamos el ID de usuario de Firebase (uid) a la ruta
            current_user_id = decoded_token['uid'] 
            
        except auth.ExpiredIdTokenError:
            return jsonify({'error': 'El token ha expirado.'}), 401
        except auth.InvalidIdTokenError as e:
            print(f"Error de token inválido: {e}")
            return jsonify({'error': 'Token inválido.'}), 401
        except Exception as e:
            print(f"Error desconocido al verificar token: {e}")
            return jsonify({'error': 'Error interno al verificar token.'}), 500
        
        # Pasa el ID de usuario de Firebase (uid) a la función de la ruta
        return f(current_user_id, *args, **kwargs)
    
    return decorated
# routes/auth_routes.py
import os
import jwt
from datetime import datetime, timedelta, timezone
import secrets
import requests
import sqlalchemy
from flask import Blueprint, jsonify, request, render_template, current_app
from sqlalchemy.exc import IntegrityError 
from werkzeug.security import generate_password_hash, check_password_hash

# --- CAMBIO IMPORTANTE ---
# Importamos la variable 'db' desde nuestro archivo 'app.py'
from app import db 
# Importamos nuestro decorador
from utils.security import token_required

# Creamos el Blueprint
auth_bp = Blueprint('auth_bp', __name__)

# Esta variable la necesita la ruta de registro
BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:8080")

# --- RUTA DE REGISTRO (MODIFICADA) ---
@auth_bp.route('/registro', methods=['GET', 'POST', 'OPTIONS'])
def registrar_usuario():
    
    if request.method == 'GET':
        return render_template('registro.html')

    if request.method == 'OPTIONS':
        return jsonify({"message": "CORS preflight OK"}), 200

    if request.method == 'POST':
        try:
            datos_usuario = request.get_json()
            
            nombre_completo = datos_usuario.get('nombre') 
            email = datos_usuario.get('email')
            password = datos_usuario.get('password')
            tipo_documento = datos_usuario.get('tipo_documento')
            numero_documento = datos_usuario.get('numero_documento')
            fecha_nacimiento = datos_usuario.get('fecha_nacimiento')

            if not all([nombre_completo, email, password, tipo_documento, numero_documento, fecha_nacimiento]):
                return jsonify({"error": "Faltan campos obligatorios para el registro."}), 400
            
            password_hasheada = generate_password_hash(password)
            estado_cuenta_nuevo = "pendiente" 
            token_verificacion_nuevo = secrets.token_urlsafe(32)

            sql_insert = sqlalchemy.text(
                """
                INSERT INTO usuarios (
                    nombre_usuario, correo_usuario, clave_usuario, tipo_documento, 
                    numero_documento, fecha_nacimiento, estado_cuenta, token_verificacion 
                )
                VALUES (:nombre, :email, :pass, :tipo_doc, :num_doc, :fecha_nac, :estado, :token)
                """
            )
            
            with db.connect() as conn:
                conn.execute(sql_insert, {
                    "nombre": nombre_completo, "email": email, "pass": password_hasheada,
                    "tipo_doc": tipo_documento, "num_doc": numero_documento, 
                    "fecha_nac": fecha_nacimiento, "estado": estado_cuenta_nuevo,
                    "token": token_verificacion_nuevo 
                })
                conn.commit() 

            # --- ENVIAR CORREO CON RESEND ---
            RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
            if not RESEND_API_KEY:
                print("ERROR: RESEND_API_KEY no está configurada.")
                return jsonify({"error": "Error interno del servidor (configuración de correo)."}), 500

            url_verificacion = f"{BASE_URL}/verificar-cuenta?token={token_verificacion_nuevo}"
            
            headers = {
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "from": "onboarding@resend.dev", 
                "to": [email],
                "subject": "¡Activa tu cuenta de Biblioteca Digital!",
                "html": f"""
                    <h3>¡Gracias por registrarte!</h3>
                    <p>Para activar tu cuenta, por favor haz clic en el siguiente enlace:</p>
                    <a href="{url_verificacion}">Activar mi cuenta</a>
                    <p>Si no te registraste, puedes ignorar este correo.</p>
                """
            }
            
            try:
                response = requests.post("https://api.resend.com/emails", json=payload, headers=headers)
                response.raise_for_status() 
            
            except requests.exceptions.RequestException as e_mail:
                print(f"Error al enviar correo con Resend: {e_mail}")
                return jsonify({
                    "error": f"Usuario registrado, pero hubo un error al enviar el correo de verificación."
                }), 500
            # ----------------------------------

            return jsonify({
                "mensaje": "¡Registro exitoso! Revisa tu correo para activar tu cuenta.",
                "email": email
            }), 201 

        except IntegrityError as e:
            return jsonify({"error": "El correo electrónico ya está registrado."}), 409
        except Exception as e:
            print(f"Error durante el registro: {e}")
            return jsonify({"error": "Error interno del servidor al procesar el registro."}), 500


# --- 4. RUTA PARA EL LOGIN DE USUARIOS ---
@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login_usuario():
    
    if request.method == 'OPTIONS':
        return jsonify({"message": "CORS preflight OK"}), 200
    
    try:
        datos_login = request.get_json()
        email = datos_login.get('email')
        password = datos_login.get('password')

        if not email or not password:
            return jsonify({"error": "Email y contraseña son obligatorios."}), 400

        with db.connect() as conn:
            sql_select = sqlalchemy.text(
                """
                SELECT id_usuario, nombre_usuario, correo_usuario, clave_usuario, estado_cuenta 
                FROM usuarios 
                WHERE correo_usuario = :email
                """
            )
            
            resultado = conn.execute(sql_select, {"email": email}).fetchone()

            if not resultado:
                return jsonify({"error": "Credenciales inválidas."}), 401
            
            if not check_password_hash(resultado.clave_usuario, password):
                return jsonify({"error": "Credenciales inválidas."}), 401

            if resultado.estado_cuenta != 'activo':
                return jsonify({"error": "Tu cuenta no ha sido verificada. Revisa tu correo."}), 403

            payload = {
                'id_usuario': resultado.id_usuario, 
                'email': resultado.correo_usuario,
                'nombre': resultado.nombre_usuario,
                'exp': datetime.now(timezone.utc) + timedelta(hours=24) 
            }
            # --- CAMBIO IMPORTANTE ---
            # Usamos current_app.config
            token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

            return jsonify({
                "mensaje": "Inicio de sesión exitoso.",
                "token": token,
                "nombre": resultado.nombre_usuario
            }), 200

    except Exception as e:
        print(f"Error durante el login: {e}")
        return jsonify({"error": "Error interno del servidor al procesar el login."}), 500


# --- 5. RUTA PARA VERIFICAR LA CUENTA ---
@auth_bp.route('/verificar-cuenta', methods=['GET'])
def verificar_cuenta():
    token = request.args.get('token')

    if not token:
        return "<h1>Error</h1><p>Falta el token de verificación. Por favor, revisa tu correo.</p>", 400

    try:
        with db.connect() as conn:
            sql_update = sqlalchemy.text(
                """
                UPDATE usuarios 
                SET 
                    estado_cuenta = 'activo', 
                    token_verificacion = NULL 
                WHERE 
                    token_verificacion = :token
                    AND estado_cuenta = 'pendiente'
                """
            )
            
            resultado = conn.execute(sql_update, {"token": token})
            conn.commit()
            
            if resultado.rowcount == 0:
                return "<h1>Error</h1><p>Enlace de verificación inválido o expirado. Por favor, intenta registrarte de nuevo.</p>", 404
            
            return "<h1>¡Cuenta activada con éxito!</h1><p>Ya puedes cerrar esta pestaña e iniciar sesión en la página.</p>", 200

    except Exception as e:
        print(f"Error al verificar cuenta: {e}")
        return "<h1>Error</h1><p>Error interno del servidor. Por favor, inténtalo más tarde.</p>", 500


# --- 9. RUTA PARA OBTENER LOS DETALLES DEL USUARIO ---
@auth_bp.route('/api/mi-cuenta', methods=['GET', 'OPTIONS'])
@token_required 
def get_mi_cuenta(current_user_id): 

    if request.method == 'OPTIONS':
        return jsonify({"message": "CORS preflight OK"}), 200

    try:
        with db.connect() as conn:
            sql_query = sqlalchemy.text("""
                SELECT 
                    nombre_usuario,
                    correo_usuario,
                    tipo_documento,
                    numero_documento,
                    fecha_nacimiento,
                    fecha_registro,
                    estado_cuenta
                FROM usuarios
                WHERE id_usuario = :uid
            """)
            
            resultado = conn.execute(sql_query, {"uid": current_user_id}).fetchone()
            
            if not resultado:
                return jsonify({"error": "Usuario no encontrado."}), 404

            detalles_usuario = {
                "nombre_usuario": resultado.nombre_usuario,
                "correo_usuario": resultado.correo_usuario,
                "tipo_documento": resultado.tipo_documento,
                "numero_documento": resultado.numero_documento,
                "fecha_nacimiento": resultado.fecha_nacimiento.isoformat() if resultado.fecha_nacimiento else None,
                "fecha_registro": resultado.fecha_registro.isoformat() if resultado.fecha_registro else None,
                "estado_cuenta": resultado.estado_cuenta
            }
            
            return jsonify(detalles_usuario)
            
    except Exception as e:
        print(f"Error al obtener detalles de la cuenta: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500
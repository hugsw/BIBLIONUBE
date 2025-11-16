import sqlalchemy
from flask import Blueprint, jsonify, request, current_app # <-- 1. Importar current_app
from sqlalchemy.exc import IntegrityError 

# from app import db  <-- 2. ¡ELIMINADO! Esta línea causaba el error de importación circular.
from utils.security import token_required 

auth_bp = Blueprint('auth_bp', __name__)

# --------------------------------------------------------------------
# RUTAS ELIMINADAS (Ya no se necesitan, Firebase las maneja):
# - /registro (POST)
# - /login (POST)
# - /verificar-cuenta (GET)
# --------------------------------------------------------------------

# --- ¡NUEVA RUTA! ---
# Esta ruta se llama DESPUÉS de que el usuario se registra en Firebase
# para guardar los datos extra (DNI, fecha de nac, etc.)
#
@auth_bp.route('/api/crear-perfil', methods=['POST', 'OPTIONS'])
@token_required # <--- Usa el nuevo decorador de Firebase
def crear_perfil_usuario(current_user_id):
    
    if request.method == 'OPTIONS':
        return jsonify({"message": "CORS preflight OK"}), 200

    try:
        datos = request.get_json()
        
        # Estos datos vienen del formulario de registro
        nombre_completo = datos.get('nombre')
        email = datos.get('email')
        tipo_documento = datos.get('tipo_documento')
        numero_documento = datos.get('numero_documento')
        fecha_nacimiento = datos.get('fecha_nacimiento')

        if not all([nombre_completo, email, tipo_documento, numero_documento, fecha_nacimiento]):
            return jsonify({"error": "Faltan campos obligatorios para crear el perfil."}), 400

        # ¡IMPORTANTE! Usamos el ID de Firebase (current_user_id)
        # para vincular nuestro perfil de SQL
        sql_insert = sqlalchemy.text(
            """
            INSERT INTO usuarios (
                firebase_uid, nombre_usuario, correo_usuario, tipo_documento, 
                numero_documento, fecha_nacimiento, estado_cuenta
            )
            VALUES (:uid, :nombre, :email, :tipo_doc, :num_doc, :fecha_nac, :estado)
            """
        )
        
        # --- 3. CORRECCIÓN ---
        # Accedemos a la BD usando 'current_app.db' en lugar de 'db'
        db_engine = current_app.db 
        with db_engine.connect() as conn:
            conn.execute(sql_insert, {
                "uid": current_user_id, # <--- El ID de Firebase
                "nombre": nombre_completo, 
                "email": email,
                "tipo_doc": tipo_documento, 
                "num_doc": numero_documento, 
                "fecha_nac": fecha_nacimiento, 
                "estado": "activo" # Lo activamos de inmediato
            })
            conn.commit() 

        return jsonify({"mensaje": "Perfil de usuario creado con éxito."}), 201

    except IntegrityError as e:
        # Esto podría pasar si el email o el uid ya existen
        print(f"Error de Integridad al crear perfil: {e}")
        return jsonify({"error": "El perfil de usuario ya existe o hay un conflicto."}), 409
    except Exception as e:
        print(f"Error al crear perfil: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500


# --- RUTA ACTUALIZADA ---
# Esta ruta (GET /api/mi-cuenta) sigue funcionando
# porque el nuevo decorador @token_required
# le pasará el ID de Firebase (current_user_id)
@auth_bp.route('/api/mi-cuenta', methods=['GET', 'OPTIONS'])
@token_required 
def get_mi_cuenta(current_user_id): 

    if request.method == 'OPTIONS':
        return jsonify({"message": "CORS preflight OK"}), 200

    try:
        # --- 4. CORRECCIÓN ---
        # Accedemos a la BD usando 'current_app.db'
        db_engine = current_app.db
        with db_engine.connect() as conn:
            # Buscamos al usuario usando el ID de Firebase
            sql_query = sqlalchemy.text("""
                SELECT 
                    nombre_usuario, correo_usuario, tipo_documento,
                    numero_documento, fecha_nacimiento, fecha_registro, estado_cuenta
                FROM usuarios
                WHERE firebase_uid = :uid
            """)
            
            resultado = conn.execute(sql_query, {"uid": current_user_id}).fetchone()
            
            if not resultado:
                return jsonify({"error": "Perfil de usuario no encontrado."}), 404

            # Convertimos el resultado de SQLAlchemy (Row) a un diccionario
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
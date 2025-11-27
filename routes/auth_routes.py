import sqlalchemy
from flask import Blueprint, jsonify, request, current_app
from sqlalchemy.exc import IntegrityError 
from utils.security import token_required 
from app import limiter 

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/api/crear-perfil', methods=['POST', 'OPTIONS'])
@limiter.limit("5 per minute") 
@token_required
def crear_perfil_usuario(current_user_id):
    
    if request.method == 'OPTIONS':
        return jsonify({"message": "CORS preflight OK"}), 200

    try:
        datos = request.get_json()
        nombre_completo = datos.get('nombre')
        email = datos.get('email')
        tipo_documento = datos.get('tipo_documento')
        numero_documento = datos.get('numero_documento')
        fecha_nacimiento = datos.get('fecha_nacimiento')

        if len(nombre_completo.strip()) < 2 or len(nombre_completo) > 100:
            return jsonify({"error": "El nombre debe tener entre 2 y 100 caracteres."}), 400

        if not numero_documento.isalnum():
            return jsonify({"error": "El número de documento solo puede contener letras y números."}), 400
            
        if len(numero_documento) < 5 or len(numero_documento) > 20:
             return jsonify({"error": "Longitud de documento inválida (debe ser entre 5 y 20 caracteres)."}), 400

        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({"error": "Formato de correo electrónico inválido."}), 400

        try:

            fecha_dt = datetime.strptime(fecha_nacimiento, '%Y-%m-%d')
            
            if fecha_dt > datetime.now():
                return jsonify({"error": "La fecha de nacimiento no puede ser futura."}), 400
                
            if fecha_dt.year < 1900:
                return jsonify({"error": "Año de nacimiento no válido."}), 400
                
        except ValueError:
            return jsonify({"error": "Formato de fecha inválido. Use AAAA-MM-DD."}), 400

        sql_insert = sqlalchemy.text(
            """
            INSERT INTO usuarios (
                firebase_uid, nombre_usuario, correo_usuario, tipo_documento, 
                numero_documento, fecha_nacimiento, estado_cuenta
            )
            VALUES (:uid, :nombre, :email, :tipo_doc, :num_doc, :fecha_nac, :estado)
            """
        )
        
        db_engine = current_app.db 
        with db_engine.connect() as conn:
            conn.execute(sql_insert, {
                "uid": current_user_id,
                "nombre": nombre_completo, 
                "email": email,
                "tipo_doc": tipo_documento, 
                "num_doc": numero_documento, 
                "fecha_nac": fecha_nacimiento, 
                "estado": "activo"
            })
            conn.commit() 

        return jsonify({"mensaje": "Perfil de usuario creado con éxito."}), 201

    except IntegrityError as e:
        current_app.logger.error(f"Error de Integridad al crear perfil: {e}")
        return jsonify({"error": "El perfil de usuario ya existe o hay un conflicto."}), 409
    except Exception as e:
        current_app.logger.error(f"Error al crear perfil: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500

@auth_bp.route('/api/mi-cuenta', methods=['GET', 'OPTIONS'])
@token_required 
def get_mi_cuenta(current_user_id): 

    if request.method == 'OPTIONS':
        return jsonify({"message": "CORS preflight OK"}), 200

    try:
        db_engine = current_app.db
        with db_engine.connect() as conn:
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
        current_app.logger.error(f"Error al obtener detalles de la cuenta: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500
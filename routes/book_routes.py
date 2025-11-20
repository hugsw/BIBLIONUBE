import sqlalchemy
from flask import Blueprint, jsonify, request, current_app, make_response
from sqlalchemy.exc import IntegrityError 
from utils.security import token_required

# Definimos el Blueprint
book_bp = Blueprint('book_bp', __name__)


# --- 1. RUTA PARA OBTENER TODOS LOS LIBROS ---
@book_bp.route("/libros")
def obtener_libros():
    try:
        db_engine = current_app.db
        with db_engine.connect() as conn:
            query_sql = """
                SELECT 
                    l.id_libro, l.titulo_libro, l.autor_libro, l.publicacion, 
                    l.descripcion, l.url_libro, c.nombre_categoria,
                    l.url_portada 
                FROM libros l
                LEFT JOIN categorias c ON l.id_categoria = c.id_categoria
                ORDER BY l.id_libro DESC
            """
            query = sqlalchemy.text(query_sql)
            resultados = conn.execute(query).fetchall()
            
            libros_lista = [row._asdict() for row in resultados]
            
            libros_mapeados = [
                {
                    "id": libro["id_libro"],
                    "titulo": libro["titulo_libro"],
                    "autor": libro["autor_libro"],
                    "publicacion": libro["publicacion"],
                    "descripcion": libro["descripcion"],
                    "url": libro["url_libro"],
                    "categoria": libro["nombre_categoria"],
                    "imagen": libro["url_portada"],
                    "alt": libro["titulo_libro"]
                } for libro in libros_lista
            ]
            
            return jsonify(libros_mapeados)
            
    except Exception as e:
        print(f"Error en /libros: {e}")
        return jsonify({"error": str(e)}), 500

# --- 2. RUTA PARA OBTENER UN SOLO LIBRO POR ID ---
@book_bp.route("/libros/<int:libro_id>")
def obtener_libro_por_id(libro_id):
    try:
        db_engine = current_app.db
        with db_engine.connect() as conn:
            query = sqlalchemy.text(
                "SELECT titulo_libro, autor_libro, publicacion, descripcion, url_libro, "
                "url_portada " 
                "FROM libros WHERE id_libro = :id"
            )
            resultado = conn.execute(query, {"id": libro_id}).fetchone()

            if resultado:
                libro_encontrado = resultado._asdict()
                
                libro_mapeado = {
                    "titulo": libro_encontrado["titulo_libro"],
                    "autor": libro_encontrado["autor_libro"],
                    "publicacion": libro_encontrado["publicacion"],
                    "descripcion": libro_encontrado["descripcion"],
                    "url": libro_encontrado["url_libro"],
                    "imagen": libro_encontrado["url_portada"],
                    "url_portada": libro_encontrado["url_portada"]
                }
                return jsonify(libro_mapeado)
            else:
                return jsonify({"error": "Libro no encontrado"}), 404
    except Exception as e:
        print(f"Error en /libros/<id>: {e}")
        return jsonify({"error": str(e)}), 500


# --- 6. RUTA PARA GUARDAR UN LIBRO (CORREGIDA) ---
@book_bp.route('/guardar-libro', methods=['POST', 'OPTIONS'])
@token_required
def guardar_libro(firebase_uid): 
    
    # Maneja la solicitud 'OPTIONS' (preflight) para CORS
    if request.method == 'OPTIONS':
        # make_response es necesario para que CORS funcione bien
        return make_response(jsonify({"message": "CORS preflight OK"}), 200)

    # La lógica de 'POST' va dentro de un try/except
    try:
        datos = request.get_json()
        libro_id = datos.get('libro_id')
        
        if not libro_id:
            return jsonify({"error": "Falta 'libro_id'."}), 400
            
        # Este bloque ahora es alcanzable y está bien indentado
        db_engine = current_app.db
        with db_engine.connect() as conn:
            
            # PASO DE TRADUCCIÓN: Busca el ID numérico (int) del usuario
            sql_find_user = sqlalchemy.text(
                "SELECT id_usuario FROM usuarios WHERE firebase_uid = :f_uid"
            )
            resultado_usuario = conn.execute(sql_find_user, {"f_uid": firebase_uid}).fetchone()

            if not resultado_usuario:
                return jsonify({"error": "Usuario no encontrado en la base de datos."}), 404
            
            internal_user_id = resultado_usuario._asdict()["id_usuario"]
            
            # USA EL ID NUMÉRICO (internal_user_id)
            sql_check = sqlalchemy.text(
                "SELECT 1 FROM libros_guardados WHERE usuario_id = :uid AND libro_id = :lid"
            )
            existe = conn.execute(sql_check, {"uid": internal_user_id, "lid": libro_id}).fetchone()
            
            if existe:
                return jsonify({"error": "Este libro ya está en tu lista."}), 409 

            sql_insert = sqlalchemy.text(
                "INSERT INTO libros_guardados (usuario_id, libro_id) VALUES (:uid, :lid)"
            )
            conn.execute(sql_insert, {"uid": internal_user_id, "lid": libro_id})
            conn.commit()
            return jsonify({"mensaje": "Libro guardado con éxito"}), 201 
    
    # Los 'except' deben estar alineados con el 'try'
    except IntegrityError:
        return jsonify({"error": "Error al guardar el libro, ID de libro no válido."}), 400
    except Exception as e:
        print(f"Error al guardar libro: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500


# --- 7. RUTA PARA OBTENER LOS LIBROS GUARDADOS (CORREGIDA) ---
@book_bp.route('/mis-libros-guardados', methods=['GET', 'OPTIONS'])
@token_required
def get_mis_libros(firebase_uid): 
    # PASO 1: Indentación de toda la función
    if request.method == 'OPTIONS':
        return make_response(jsonify({"message": "CORS preflight OK"}), 200)
    
    # PASO 2: El 'try' debe estar indentado y 'except' debe alinearse con él
    try:
        db_engine = current_app.db
        with db_engine.connect() as conn:
            
            # --- PASO DE TRADUCCIÓN ---
            sql_find_user = sqlalchemy.text(
                "SELECT id_usuario FROM usuarios WHERE firebase_uid = :f_uid"
            )
            resultado_usuario = conn.execute(sql_find_user, {"f_uid": firebase_uid}).fetchone()
            
            if not resultado_usuario:
                return jsonify({"error": "Usuario no encontrado en la base de datos."}), 404
            
            # PASO 3 (LÓGICA): Mover esta línea FUERA del 'if'
            internal_user_id = resultado_usuario._asdict()["id_usuario"]

            # --- USAR EL ID NUMÉRICO ---
            sql_query = sqlalchemy.text("""
            SELECT 
                L.id_libro, 
                L.titulo_libro, 
                L.url_portada 
            FROM libros L
            JOIN libros_guardados G ON L.id_libro = G.libro_id
            WHERE G.usuario_id = :uid
            """)
            
            resultados = conn.execute(sql_query, {"uid": internal_user_id}).fetchall()
            
            libros_lista = [row._asdict() for row in resultados]
            libros_mapeados = [
                {
                    "id": libro["id_libro"],
                    "titulo": libro["titulo_libro"],
                    "imagen": libro["url_portada"],
                    "alt": libro["titulo_libro"]
                } for libro in libros_lista
            ]
            
            return jsonify(libros_mapeados)

    # PASO 2 (Continuación): 'except' alineado con 'try'
    except Exception as e:
        print(f"Error al obtener libros guardados: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500


# --- 8. RUTA PARA QUITAR UN LIBRO (CORREGIDA) ---
@book_bp.route('/quitar-libro', methods=['DELETE', 'OPTIONS']) 
@token_required
def quitar_libro(firebase_uid): 
    # PASO 1: Indentación de toda la función
    if request.method == 'OPTIONS':
        return make_response(jsonify({"message": "CORS preflight OK"}), 200)
    
    # PASO 2: 'try' indentado
    try:
        datos = request.get_json()
        libro_id = datos.get('libro_id')
        
        if not libro_id:
            return jsonify({"error": "Falta 'libro_id'."}), 400
        
        # PASO 3 (LÓGICA): Mover el bloque de DB FUERA del 'if'
        db_engine = current_app.db
        with db_engine.connect() as conn:
            
            # --- PASO DE TRADUCCIÓN ---
            sql_find_user = sqlalchemy.text(
                "SELECT id_usuario FROM usuarios WHERE firebase_uid = :f_uid"
            )
            resultado_usuario = conn.execute(sql_find_user, {"f_uid": firebase_uid}).fetchone()
            
            if not resultado_usuario:
                return jsonify({"error": "Usuario no encontrado en la base de datos."}), 404
            
            # PASO 3 (LÓGICA): Mover esta línea FUERA del 'if'
            internal_user_id = resultado_usuario._asdict()["id_usuario"]
            
            # --- USAR EL ID NUMÉRICO ---
            sql_delete = sqlalchemy.text(
                "DELETE FROM libros_guardados WHERE usuario_id = :uid AND libro_id = :lid"
            )
            
            resultado = conn.execute(sql_delete, {"uid": internal_user_id, "lid": libro_id})
            conn.commit()
            
            if resultado.rowcount == 0:
                return jsonify({"error": "El libro no estaba en tu lista."}), 404
                
            return jsonify({"mensaje": "Libro eliminado de tu lista."}), 200

    # PASO 2 (Continuación): 'except' alineado con 'try'
    except Exception as e:
        print(f"Error al quitar libro: {e}")
        return jsonify({"error": "Error interno del servidor."}), 


# En book_bp.py
@book_bp.route('/api/buscar')
def api_buscar_libros():
    search_query = request.args.get('query', '')
    
    if not search_query:
        return jsonify([])

    try:
        db_engine = current_app.db
        with db_engine.connect() as conn:
            # Buscamos coincidencias en Título O Autor
            sql = sqlalchemy.text("""
                SELECT id_libro, titulo_libro, url_portada 
                FROM libros 
                WHERE titulo_libro LIKE :q OR autor_libro LIKE :q
            """)
            # Los % permiten encontrar coincidencias parciales
            resultados = conn.execute(sql, {"q": f"%{search_query}%"}).fetchall()
            
            libros = [
                {
                    "id": row.id_libro,
                    "titulo": row.titulo_libro,
                    "imagen": row.url_portada
                } for row in resultados
            ]
            return jsonify(libros)
            
    except Exception as e:
        print(f"Error búsqueda: {e}")
        return jsonify({"error": "Error en servidor"}), 500
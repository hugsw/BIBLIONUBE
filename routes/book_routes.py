# routes/book_routes.py
import sqlalchemy
from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError 

# Importamos la variable 'db' desde nuestro archivo 'app.py'
from app import db 
# Importamos nuestro decorador
from utils.security import token_required

# Creamos el Blueprint
book_bp = Blueprint('book_bp', __name__)


# --- 1. RUTA PARA OBTENER TODOS LOS LIBROS ---
@book_bp.route("/libros")
def obtener_libros():
    try:
        with db.connect() as conn:
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
            libros_lista = [
                {
                    "id": row.id_libro, "titulo": row.titulo_libro, "autor": row.autor_libro,
                    "publicacion": row.publicacion, 
                    "descripcion": row.descripcion,
                    "url": row.url_libro, "categoria": row.nombre_categoria,
                    "imagen": row.url_portada, 
                    "alt": row.titulo_libro 
                } for row in resultados
            ]
            return jsonify(libros_lista)
    except Exception as e:
        print(f"Error en /libros: {e}")
        return jsonify({"error": str(e)}), 500

# --- 2. RUTA PARA OBTENER UN SOLO LIBRO POR ID ---
@book_bp.route("/libros/<int:libro_id>")
def obtener_libro_por_id(libro_id):
    try:
        with db.connect() as conn:
            query = sqlalchemy.text(
                "SELECT titulo_libro, autor_libro, publicacion, descripcion, url_libro, "
                "url_portada " 
                "FROM libros WHERE id_libro = :id"
            )
            resultado = conn.execute(query, {"id": libro_id}).fetchone()

            if resultado:
                libro_encontrado = {
                    "titulo": resultado.titulo_libro, "autor": resultado.autor_libro,
                    "publicacion": resultado.publicacion, 
                    "descripcion": resultado.descripcion,
                    "url": resultado.url_libro,
                    "imagen": resultado.url_portada, 
                    "url_portada": resultado.url_portada 
                }
                return jsonify(libro_encontrado)
            else:
                return jsonify({"error": "Libro no encontrado"}), 404
    except Exception as e:
        print(f"Error en /libros/<id>: {e}")
        return jsonify({"error": str(e)}), 500

# --- 6. RUTA PARA GUARDAR UN LIBRO ---
@book_bp.route('/guardar-libro', methods=['POST', 'OPTIONS'])
@token_required
def guardar_libro(current_user_id):
    
    if request.method == 'OPTIONS':
        return jsonify({"message": "CORS preflight OK"}), 200
    
    try:
        datos = request.get_json()
        libro_id = datos.get('libro_id')
        
        if not libro_id:
            return jsonify({"error": "Falta 'libro_id'."}), 400

        with db.connect() as conn:
            sql_check = sqlalchemy.text(
                "SELECT 1 FROM libros_guardados WHERE usuario_id = :uid AND libro_id = :lid"
            )
            existe = conn.execute(sql_check, {"uid": current_user_id, "lid": libro_id}).fetchone()
            
            if existe:
                return jsonify({"error": "Este libro ya está en tu lista."}), 409 

            sql_insert = sqlalchemy.text(
                "INSERT INTO libros_guardados (usuario_id, libro_id) VALUES (:uid, :lid)"
            )
            conn.execute(sql_insert, {"uid": current_user_id, "lid": libro_id})
            conn.commit()
        
        return jsonify({"mensaje": "Libro guardado con éxito"}), 201 

    except IntegrityError:
        return jsonify({"error": "Error al guardar el libro, ID de libro no válido."}), 400
    except Exception as e:
        print(f"Error al guardar libro: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500


# --- 7. RUTA PARA OBTENER LOS LIBROS GUARDADOS ---
@book_bp.route('/mis-libros-guardados', methods=['GET', 'OPTIONS'])
@token_required
def get_mis_libros(current_user_id):
    
    if request.method == 'OPTIONS':
        return jsonify({"message": "CORS preflight OK"}), 200

    try:
        with db.connect() as conn:
            sql_query = sqlalchemy.text("""
                SELECT 
                    L.id_libro, 
                    L.titulo_libro, 
                    L.url_portada 
                FROM libros L
                JOIN libros_guardados G ON L.id_libro = G.libro_id
                WHERE G.usuario_id = :uid
            """)
            resultados = conn.execute(sql_query, {"uid": current_user_id}).fetchall()
            
            libros_lista = [
                {
                    "id": row.id_libro,
                    "titulo": row.titulo_libro,
                    "imagen": row.url_portada, 
                    "alt": row.titulo_libro
                } for row in resultados
            ]
            
            return jsonify(libros_lista)
            
    except Exception as e:
        print(f"Error al obtener libros guardados: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500

# --- 8. RUTA PARA QUITAR UN LIBRO ---
@book_bp.route('/quitar-libro', methods=['DELETE', 'OPTIONS']) 
@token_required
def quitar_libro(current_user_id):

    if request.method == 'OPTIONS':
        return jsonify({"message": "CORS preflight OK"}), 200
        
    try:
        datos = request.get_json()
        libro_id = datos.get('libro_id')
        
        if not libro_id:
            return jsonify({"error": "Falta 'libro_id'."}), 400
            
        with db.connect() as conn:
            sql_delete = sqlalchemy.text(
                "DELETE FROM libros_guardados WHERE usuario_id = :uid AND libro_id = :lid"
            )
            resultado = conn.execute(sql_delete, {"uid": current_user_id, "lid": libro_id})
            conn.commit()
            
            if resultado.rowcount == 0:
                return jsonify({"error": "El libro no estaba en tu lista."}), 404
        
        return jsonify({"mensaje": "Libro eliminado de tu lista."}), 200

    except Exception as e:
        print(f"Error al quitar libro: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500
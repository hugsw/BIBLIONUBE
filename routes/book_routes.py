import sqlalchemy
from flask import Blueprint, jsonify, request, current_app, make_response
from sqlalchemy.exc import IntegrityError 
from utils.security import token_required
from utils.recommendation_engine import recomendador

from extensions import cache

def obtener_id_usuario_interno(conn, firebase_uid):
    """Busca el ID numérico del usuario basado en su UID de Firebase."""
    sql = sqlalchemy.text("SELECT id_usuario FROM usuarios WHERE firebase_uid = :f_uid")
    resultado = conn.execute(sql, {"f_uid": firebase_uid}).fetchone()
    if resultado:
        return resultado[0]
    return None

book_bp = Blueprint('book_bp', __name__)

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
                    "id": row.id_libro,
                    "titulo": row.titulo_libro,
                    "autor": row.autor_libro,
                    "publicacion": row.publicacion,
                    "descripcion": row.descripcion,
                    "url": row.url_libro,
                    "categoria": row.nombre_categoria,
                    "imagen": row.url_portada,
                    "alt": row.titulo_libro
                } for row in resultados
            ]
            
            return jsonify(libros_mapeados)
            
    except Exception as e:
        current_app.logger.error(f"Error en /libros: {e}")
        return jsonify({"error": str(e)}), 500

@book_bp.route("/libros/<int:libro_id>")
def obtener_libro_por_id(libro_id):
    try:
        db_engine = current_app.db
        with db_engine.connect() as conn:
            query = sqlalchemy.text(
                "SELECT id_libro, titulo_libro, autor_libro, publicacion, descripcion, url_libro, "
                "url_portada, id_categoria " 
                "FROM libros WHERE id_libro = :id"
            )
            resultado = conn.execute(query, {"id": libro_id}).fetchone()

            if resultado:
                libro_encontrado = resultado._asdict()
                
                libro_mapeado = {
                    "id": libro_encontrado["id_libro"],
                    "titulo": libro_encontrado["titulo_libro"],
                    "autor": libro_encontrado["autor_libro"],
                    "publicacion": libro_encontrado["publicacion"],
                    "descripcion": libro_encontrado["descripcion"],
                    "url": libro_encontrado["url_libro"],
                    "imagen": libro_encontrado["url_portada"],
                    "url_portada": libro_encontrado["url_portada"],
                    "id_categoria": libro_encontrado["id_categoria"]
                }
                return jsonify(libro_mapeado)
            else:
                return jsonify({"error": "Libro no encontrado"}), 404
    except Exception as e:
        current_app.logger.error(f"Error en /libros/<id>: {e}")
        return jsonify({"error": str(e)}), 500

@book_bp.route('/guardar-libro', methods=['POST', 'OPTIONS'])
@token_required
def guardar_libro(firebase_uid): 

    if request.method == 'OPTIONS':
        return make_response(jsonify({"message": "CORS preflight OK"}), 200)
    try:
        datos = request.get_json()
        libro_id = datos.get('libro_id')

        if not libro_id:
            return jsonify({"error": "Falta 'libro_id'."}), 400

        db_engine = current_app.db
        with db_engine.connect() as conn:
            
            internal_user_id = obtener_id_usuario_interno(conn, firebase_uid)

            if not internal_user_id:
                return jsonify({"error": "Usuario no encontrado en la base de datos."}), 404

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
    except IntegrityError:
        return jsonify({"error": "Error al guardar el libro, ID de libro no válido."}), 400
    except Exception as e:
        current_app.logger.error(f"Error al guardar libro: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500

@book_bp.route('/mis-libros-guardados', methods=['GET', 'OPTIONS'])
@token_required
def get_mis_libros(firebase_uid): 

    if request.method == 'OPTIONS':
        return make_response(jsonify({"message": "CORS preflight OK"}), 200)

    try:
        db_engine = current_app.db
        with db_engine.connect() as conn:

            internal_user_id = obtener_id_usuario_interno(conn, firebase_uid)
            if not internal_user_id:
                return jsonify({"error": "Usuario no encontrado en la base de datos."}), 404

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
            libros_mapeados = [
                {
                    "id": row.id_libro,
                    "titulo": row.titulo_libro,
                    "imagen": row.url_portada,
                    "alt": row.titulo_libro
                } for row in resultados
            ]
            
            return jsonify(libros_mapeados)

    except Exception as e:
        current_app.logger.error(f"Error al obtener libros guardados: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500

@book_bp.route('/quitar-libro', methods=['DELETE', 'OPTIONS']) 
@token_required
def quitar_libro(firebase_uid): 

    if request.method == 'OPTIONS':
        return make_response(jsonify({"message": "CORS preflight OK"}), 200)
    try:
        datos = request.get_json()
        libro_id = datos.get('libro_id')
        
        if not libro_id:
            return jsonify({"error": "Falta 'libro_id'."}), 400
        
        db_engine = current_app.db
        with db_engine.connect() as conn:
            
            internal_user_id = obtener_id_usuario_interno(conn, firebase_uid)
            if not internal_user_id:
                return jsonify({"error": "Usuario no encontrado en la base de datos."}), 404
            
            sql_delete = sqlalchemy.text(
                "DELETE FROM libros_guardados WHERE usuario_id = :uid AND libro_id = :lid"
            )
            
            resultado = conn.execute(sql_delete, {"uid": internal_user_id, "lid": libro_id})
            conn.commit()
            
            if resultado.rowcount == 0:
                return jsonify({"error": "El libro no estaba en tu lista."}), 404
                
            return jsonify({"mensaje": "Libro eliminado de tu lista."}), 200

    except Exception as e:
        current_app.logger.error(f"Error al quitar libro: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500

@book_bp.route('/api/buscar')
def api_buscar_libros():
    search_query = request.args.get('query', '')
    
    if not search_query:
        return jsonify([])

    try:
        db_engine = current_app.db
        with db_engine.connect() as conn:
            
            sql = sqlalchemy.text("""
                SELECT id_libro, titulo_libro, url_portada 
                FROM libros 
                WHERE titulo_libro LIKE :q OR autor_libro LIKE :q
            """)
           
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
        current_app.logger.error(f"Error búsqueda: {e}")
        return jsonify({"error": "Error en servidor"}), 500

@book_bp.route("/libros/recomendados/<int:cat_id>")
def obtener_recomendados(cat_id):
    try:
        exclude_id = request.args.get('exclude', type=int)
        
        db_engine = current_app.db
        with db_engine.connect() as conn:
            query_sql = """
                SELECT id_libro, titulo_libro, autor_libro, url_portada 
                FROM libros 
                WHERE id_categoria = :cat_id AND id_libro != :exclude
                ORDER BY RAND() 
                LIMIT 30
            """
            query = sqlalchemy.text(query_sql)
            resultados = conn.execute(query, {"cat_id": cat_id, "exclude": exclude_id or 0}).fetchall()
            
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
        current_app.logger.error(f"Error en recomendados: {e}")
        return jsonify([])

@book_bp.route('/libros/recomendados/mis-guardados')
@token_required
def obtener_recomendados_guardados(firebase_uid):
    try:
        db_engine = current_app.db
        with db_engine.connect() as conn:
            
            internal_user_id = obtener_id_usuario_interno(conn, firebase_uid)
            if not internal_user_id:
                return jsonify({"error": "Usuario no encontrado en la base de datos."}), 404

            query_sql = """
                SELECT l.id_libro, l.titulo_libro, l.url_portada 
                FROM libros l
                WHERE l.id_categoria IN (
                    SELECT DISTINCT l2.id_categoria 
                    FROM libros l2
                    JOIN libros_guardados g ON l2.id_libro = g.libro_id
                    WHERE g.usuario_id = :uid
                )
                AND l.id_libro NOT IN (
                    SELECT libro_id FROM libros_guardados WHERE usuario_id = :uid
                )
                ORDER BY RAND()
                LIMIT 22
            """
            
            resultados = conn.execute(sqlalchemy.text(query_sql), {"uid": internal_user_id}).fetchall()
            
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
        current_app.logger.error(f"Error en recomendados guardados: {e}")
        return jsonify({"error": str(e)}), 500

@book_bp.route("/libros/recomendados-ml/<int:libro_id>")
@cache.cached(timeout=3600, query_string=True)
def obtener_recomendados_inteligentes(libro_id):
    try:
        if recomendador.necesita_entrenamiento():
            current_app.logger.info("Entrenando motor de recomendaciones por primera vez...")
            db_engine = current_app.db
            with db_engine.connect() as conn:
                query_train = sqlalchemy.text("SELECT id_libro, descripcion FROM libros ORDER BY id_libro DESC")
                todos_libros = conn.execute(query_train).fetchall()
                datos_para_entrenar = [
                    {"id_libro": row.id_libro, "descripcion": row.descripcion} 
                    for row in todos_libros
                ]
                recomendador.entrenar(datos_para_entrenar)

        ids_recomendados = recomendador.obtener_recomendaciones(libro_id)

        if not ids_recomendados:
            return jsonify([]) 

        db_engine = current_app.db
        with db_engine.connect() as conn:
            bind_params = {f"id{i}": id_val for i, id_val in enumerate(ids_recomendados)}
            placeholders = ", ".join([f":id{i}" for i in range(len(ids_recomendados))])
            
            query_final = sqlalchemy.text(f"""
                SELECT id_libro, titulo_libro, autor_libro, url_portada 
                FROM libros 
                WHERE id_libro IN ({placeholders})
                ORDER BY FIELD(id_libro, {placeholders})
            """)
            
            resultados = conn.execute(query_final, bind_params).fetchall()

            libros_response = [
                {
                    "id": row.id_libro,
                    "titulo": row.titulo_libro,
                    "imagen": row.url_portada,
                    "alt": row.titulo_libro
                } for row in resultados
            ]
            
            return jsonify(libros_response)

    except Exception as e:
        current_app.logger.error(f"Error en ML: {e}")
        return jsonify({"error": str(e)}), 500

# En routes/book_routes.py

@book_bp.route('/api/estadisticas-populares')
def obtener_estadisticas_populares():
    """
    Devuelve el Top 10 de libros más guardados para el gráfico.
    """
    try:
        db_engine = current_app.db
        with db_engine.connect() as conn:
            # Consulta SQL optimizada para contar y agrupar
            sql = sqlalchemy.text("""
                SELECT 
                    l.titulo_libro, 
                    COUNT(lg.libro_id) as total_guardados
                FROM 
                    libros_guardados lg
                JOIN 
                    libros l ON lg.libro_id = l.id_libro
                GROUP BY 
                    l.id_libro, l.titulo_libro
                ORDER BY 
                    total_guardados DESC
                LIMIT 10
            """)
            
            resultados = conn.execute(sql).fetchall()
            
            # Formateamos para Google Charts: [["Titulo", Cantidad], ...]
            datos_grafico = []
            for row in resultados:
                datos_grafico.append({
                    "titulo": row.titulo_libro, 
                    "cantidad": int(row.total_guardados)
                })
            
            return jsonify(datos_grafico)

    except Exception as e:
        current_app.logger.error(f"Error en estadísticas: {e}")
        return jsonify({"error": "Error al obtener estadísticas"}), 500
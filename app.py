# app.py (Corregido para evitar importación circular)
import os
import sqlalchemy
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Importa SÓLO la lógica de la base de datos
from database import connect_with_connector, warm_up_db

# NO importamos las rutas aquí todavía

# Cargar variables de entorno
load_dotenv()

# --- 1. Inicialización de la App ---
app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')

# --- 2. Inicialización de la Base de Datos ---
# Definimos 'db' aquí para que sea importable por otros módulos
db: sqlalchemy.engine.base.Engine = None

print("Iniciando conexión a la base de datos...")
# Pasamos 'app' a la función para que pueda leer app.config
db = connect_with_connector(app) # <--- db SE CREA AQUÍ

if db is None:
    print("¡ERROR! No se pudo inicializar la conexión a la base de datos.")
else:
    print("¡Conexión exitosa! (Objeto Engine creado)")
    warm_up_db(db) # Calentamos el pool

# --- 3. Registro de Blueprints (Rutas) ---

# ¡AHORA SÍ importamos las rutas!
# En este punto, 'db' ya existe y las rutas pueden importarlo sin error.
from routes.web_routes import web_bp
from routes.auth_routes import auth_bp
from routes.book_routes import book_bp

# Aquí le decimos a Flask que use las rutas de tus otros archivos
app.register_blueprint(web_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(book_bp)

# --- 4. Punto de Entrada ---
if __name__ == "__main__":
    app.run(debug=False, port=int(os.environ.get('PORT', 8080)), host='0.0.0.0')
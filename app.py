# app.py (Actualizado para Firebase)
import os
import sqlalchemy
import firebase_admin # <--- 1. Importar
from firebase_admin import credentials # <--- 2. Importar
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Importa SÓLO la lógica de la base de datos
from database import connect_with_connector, warm_up_db

# Cargar variables de entorno
load_dotenv()

# --- 1. Inicialización de la App ---
app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')

# --- 2. Inicialización de Firebase Admin ---
# Carga la llave maestra desde el archivo que descargaste
cred = credentials.Certificate('firebase-service-account.json')
firebase_admin.initialize_app(cred)
print("¡Firebase Admin inicializado con éxito!")

# --- 3. Inicialización de la Base de Datos ---
db: sqlalchemy.engine.base.Engine = None

print("Iniciando conexión a la base de datos...")
db = connect_with_connector(app) 

if db is None:
    print("¡ERROR! No se pudo inicializar la conexión a la base de datos.")
else:
    print("¡Conexión exitosa! (Objeto Engine creado)")
    warm_up_db(db) # Calentamos el pool

# --- 4. Registro de Blueprints (Rutas) ---
# (Esto está en el orden correcto para evitar importación circular)
from routes.web_routes import web_bp
from routes.auth_routes import auth_bp
from routes.book_routes import book_bp

app.register_blueprint(web_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(book_bp)

# --- 5. Punto de Entrada ---
if __name__ == "__main__":
    app.run(debug=False, port=int(os.environ.get('PORT', 8080)), host='0.0.0.0')
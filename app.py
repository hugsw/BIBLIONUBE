import os
import sqlalchemy
import firebase_admin
from firebase_admin import credentials
from flask import Flask, current_app 
from flask_cors import CORS
from dotenv import load_dotenv
from whitenoise import WhiteNoise # <--- 1. IMPORTAR WHITENOISE

# Importa SÓLO la lógica de la base de datos
from database import connect_with_connector, warm_up_db

# Cargar variables de entorno PRIMERO
load_dotenv() 

# --- 1. Inicialización de Firebase (CORREGIDO) ---
print("Inicializando Firebase Admin...")
try:
    # Lee la ruta del archivo de credenciales
    cred_path = os.environ.get('FIREBASE_CREDS_PATH', '/etc/secrets/firebase-service-account.json')
    
    # ESTA ES LA COMPROBACIÓN CORRECTA Y SEGURA PARA GUNICORN
    if not firebase_admin._apps and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("¡Firebase Admin inicializado con éxito!")
    elif not os.path.exists(cred_path):
        print(f"ADVERTENCIA: No se encontró el archivo de credenciales de Firebase en '{cred_path}'.")
    else:
        # Esto significa que _apps ya tiene algo, por lo que ya está inicializado.
        print("Firebase Admin ya estaba inicializado (en este worker).")

except Exception as e:
    # Captura cualquier otro error de inicialización
    print(f"Un error inesperado ocurrió al inicializar Firebase: {e}")


# --- 2. Creación de la Fábrica de la App ---
def create_app():
    """Crea y configura la instancia de la aplicación Flask."""
    
    # --- 2a. Inicialización de la App ---
    app = Flask(__name__)
    CORS(app)
    
    # Carga la configuración de Flask
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
    print("App Flask creada y configurada.")

    # --- 2b. Inicialización de la Base de Datos ---
    with app.app_context():
        print("Iniciando conexión a la base de datos...")
        db = connect_with_connector(app) 
        
        if db is None:
            print("¡ERROR! No se pudo inicializar la conexión a la base de datos.")
        else:
            print("¡Conexión exitosa! (Objeto Engine creado)")
            warm_up_db(db)
        
        # Añade la base de datos al contexto de la app para que las rutas la usen
        current_app.db = db

    # --- 2c. Registro de Blueprints (Rutas) ---
    from routes.web_routes import web_bp
    from routes.auth_routes import auth_bp
    from routes.book_routes import book_bp

    app.register_blueprint(web_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(book_bp)
    print("Blueprints registrados.")

    return app

# --- 3. Punto de Entrada (SOLO para Gunicorn) ---
# Gunicorn busca esta variable 'app'
app = create_app()

# --- 4. CONFIGURACIÓN DE WHITENOISE (CORREGIDO) ---
# Esta línea define la ruta a tu carpeta 'static'
static_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')

# 2. CORRECCIÓN: Pasa la app Y la ruta 'root' a WhiteNoise
# Esto le dice a WhiteNoise dónde encontrar los archivos estáticos.
app.wsgi_app = WhiteNoise(app.wsgi_app, root=static_root) 

# 3. (Esta línea ya no es necesaria)
# app.config['WHITENOISE_ROOT'] = static_root

print(f"WhiteNoise configurado para servir archivos desde: {static_root}")
# --- FIN DE CONFIGURACIÓN DE WHITENOISE ---


# --- 5. Punto de Entrada (SOLO para desarrollo local) ---
if __name__ == "__main__":
    # Inicia el servidor Flask
    app.run(debug=False, port=int(os.environ.get('PORT', 8080)), host='0.0.0.0')
import os
import sqlalchemy
import firebase_admin
from firebase_admin import credentials
from flask import Flask, current_app # <-- Importante: Importar current_app
from flask_cors import CORS
from dotenv import load_dotenv

# Importa SÓLO la lógica de la base de datos
from database import connect_with_connector, warm_up_db

# Cargar variables de entorno PRIMERO
load_dotenv()

# --- 1. Inicialización de Firebase (fuera de la fábrica) ---
# Esto está bien hacerlo solo una vez al inicio.
print("Inicializando Firebase Admin...")
try:
    # Lee la ruta del archivo de credenciales desde una variable de entorno
    # Si no existe, usa la ruta de Render como respaldo.
    cred_path = os.environ.get('FIREBASE_CREDS_PATH', '/etc/secrets/firebase-service-account.json')
    
    # Comprobar si el archivo existe antes de intentar usarlo
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("¡Firebase Admin inicializado con éxito!")
    else:
        print(f"ADVERTENCIA: No se encontró el archivo de credenciales de Firebase en '{cred_path}'.")

except ValueError:
    # Esto evita que crashee si Gunicorn recarga y la app ya existe
    print("Firebase Admin ya estaba inicializado.")
except FileNotFoundError:
    print(f"ERROR: No se pudo encontrar el archivo de credenciales de Firebase en '{cred_path}'.")
except Exception as e:
    print(f"Un error inesperado ocurrió al inicializar Firebase: {e}")


# --- 2. Creación de la Fábrica de la App ---
def create_app():
    """Crea y configura la instancia de la aplicación Flask."""
    
    # --- 2a. Inicialización de la App ---
    app = Flask(__name__)
    CORS(app)
    
    # Carga la config desde variables de entorno
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
    print("App Flask creada y configurada.")

    # --- 2b. Inicialización de la Base de Datos ---
    # Usamos 'with app.app_context()' para que la BD sepa a qué app pertenece
    with app.app_context():
        print("Iniciando conexión a la base de datos...")
        db = connect_with_connector(app) 
        
        if db is None:
            print("¡ERROR! No se pudo inicializar la conexión a la base de datos.")
            # Puedes decidir si quieres que la app falle si no hay BD
            # raise Exception("No se pudo conectar a la base de datos.")
        else:
            print("¡Conexión exitosa! (Objeto Engine creado)")
            warm_up_db(db)
        
        # AÑADE LA BASE DE DATOS AL CONTEXTO DE LA APP
        # Así, las rutas pueden acceder a ella con 'current_app.db'
        current_app.db = db

    # --- 2c. Registro de Blueprints (Rutas) ---
    # IMPORTANTE: Importamos las rutas AQUÍ, dentro de la función
    # Esto rompe la importación circular
    from routes.web_routes import web_bp
    from routes.auth_routes import auth_bp
    from routes.book_routes import book_bp

    app.register_blueprint(web_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(book_bp)
    print("Blueprints registrados.")

    return app

# --- 3. Punto de Entrada (SOLO para Gunicorn) ---
# Gunicorn busca esta variable 'app' por defecto
app = create_app()


# --- 4. Punto de Entrada (SOLO para desarrollo local) ---
if __name__ == "__main__":
    # Esta variable 'app' es la creada en la línea anterior
    app.run(debug=False, port=int(os.environ.get('PORT', 8080)), host='0.0.0.0')
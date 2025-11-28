import os
import sqlalchemy
import firebase_admin
import logging
from firebase_admin import credentials
from flask import Flask, current_app, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from whitenoise import WhiteNoise
from flask_caching import Cache 
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address 
from flask_compress import Compress 
from database import connect_with_connector, warm_up_db

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

basedir = os.path.abspath(os.path.dirname(__file__))
env_path = os.path.join(basedir, '.env')
load_dotenv(env_path)

print(f"--> Intentando cargar .env desde: {env_path}")
print(f"--> TEST LECTURA API KEY: {os.environ.get('FIREBASE_API_KEY')}")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

cache = Cache(config={'CACHE_TYPE': 'SimpleCache', 'CACHE_DEFAULT_TIMEOUT': 3600})

limiter = Limiter(key_func=get_remote_address)

logging.info("Inicializando Firebase Admin...")
try:
    cred_path = os.environ.get('FIREBASE_CREDS_PATH', '/etc/secrets/firebase-service-account.json')
    if not firebase_admin._apps and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        logging.info("¡Firebase Admin inicializado con éxito!")
    elif not os.path.exists(cred_path):
        logging.info(f"ADVERTENCIA: No se encontró el archivo de credenciales de Firebase en '{cred_path}'.")
    else:
        logging.info("Firebase Admin ya estaba inicializado (en este worker).")

except Exception as e:
    logging.info(f"Un error inesperado ocurrió al inicializar Firebase: {e}")

def create_app():
    """Crea y configura la instancia de la aplicación Flask."""
    
    app = Flask(__name__)
    CORS(app)
    
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
    
    cache.init_app(app)

    Compress(app) 
    
    limiter.init_app(app)

    limiter.default_limits = ["1000 per day", "200 per hour"]
    
    logging.info("App Flask creada y configurada con seguridad y compresión.")

    @app.context_processor
    def inject_firebase_config():
        return {
            'firebase_config': {
                'apiKey': os.environ.get('FIREBASE_API_KEY'),
                'authDomain': os.environ.get('FIREBASE_AUTH_DOMAIN'),
                'projectId': os.environ.get('FIREBASE_PROJECT_ID'),
                'storageBucket': os.environ.get('FIREBASE_STORAGE_BUCKET'),
                'messagingSenderId': os.environ.get('FIREBASE_SENDER_ID'),
                'appId': os.environ.get('FIREBASE_APP_ID'),
                'measurementId': os.environ.get('FIREBASE_MEASUREMENT_ID')
            }
        }

    with app.app_context():
        logging.info("Iniciando conexión a la base de datos...")
        db = connect_with_connector(app) 
        
        if db is None:
            logging.info("¡ERROR! No se pudo inicializar la conexión a la base de datos.")
        else:
            logging.info("¡Conexión exitosa! (Objeto Engine creado)")
            warm_up_db(db)
        
        current_app.db = db

    from routes.web_routes import web_bp
    from routes.auth_routes import auth_bp
    from routes.book_routes import book_bp

    app.register_blueprint(web_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(book_bp)

    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('404.html'), 404
        
    @app.errorhandler(429)
    def ratelimit_handler(e):
        current_app.logger.warning(f"Rate limit excedido por: {get_remote_address()}")
        return render_template('404.html'), 429 

    logging.info("Blueprints registrados.")

    return app

app = create_app()

project_root = os.path.dirname(os.path.abspath(__file__)) 
static_root = os.path.join(project_root, 'static')

app.wsgi_app = WhiteNoise(app.wsgi_app, root=static_root) 

logging.info(f"WhiteNoise configurado para servir archivos desde: {static_root}")

if __name__ == "__main__":
    app.run(debug=False, port=int(os.environ.get('PORT', 8080)), host='0.0.0.0')
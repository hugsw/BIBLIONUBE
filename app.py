import os
import sqlalchemy
import firebase_admin
import logging
from firebase_admin import credentials
from flask import Flask, current_app 
from flask_cors import CORS
from dotenv import load_dotenv
from whitenoise import WhiteNoise
from database import connect_with_connector, warm_up_db

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

load_dotenv()

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
    logging.info("App Flask creada y configurada.")

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
    logging.info("Blueprints registrados.")

    return app

app = create_app()

project_root = os.path.dirname(os.path.abspath(__file__)) 

static_root = os.path.join(project_root, 'static')

app.wsgi_app = WhiteNoise(app.wsgi_app, root=static_root) 

logging.info(f"WhiteNoise configurado para servir archivos desde: {static_root}")

if __name__ == "__main__":
    app.run(debug=False, port=int(os.environ.get('PORT', 8080)), host='0.0.0.0')
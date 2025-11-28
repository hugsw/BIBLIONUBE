import os
import sqlalchemy
import firebase_admin
import logging
from firebase_admin import credentials
from flask import Flask, current_app, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from whitenoise import WhiteNoise
from flask_compress import Compress 
from database import connect_with_connector, warm_up_db
from flask_limiter.util import get_remote_address
from extensions import cache, limiter
from utils.recommendation_engine import recomendador

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

basedir = os.path.abspath(os.path.dirname(__file__))
env_path = os.path.join(basedir, '.env')
load_dotenv(env_path)

logging.info("Inicializando Firebase Admin...")
try:
    cred_path = os.environ.get('FIREBASE_CREDS_PATH', 'firebase-service-account.json')
    
    if not os.path.isabs(cred_path):
        cred_path = os.path.join(basedir, cred_path)

    if not firebase_admin._apps and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        logging.info("¡Firebase Admin inicializado con éxito!")
    elif not os.path.exists(cred_path):
        logging.warning(f"ADVERTENCIA: No se encontró el archivo de credenciales de Firebase en '{cred_path}'.")
    else:
        logging.info("Firebase Admin ya estaba inicializado.")

except Exception as e:
    logging.error(f"Un error inesperado ocurrió al inicializar Firebase: {e}")

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
    
    cache.init_app(app)
    Compress(app) 
    limiter.init_app(app)
    
    limiter.default_limits = ["1000 per day", "200 per hour"]
    
    logging.info("App Flask creada y configurada.")

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
            logging.error("¡ERROR! No se pudo inicializar la conexión a la base de datos.")
        else:
            logging.info("¡Conexión exitosa! (Objeto Engine creado)")
            warm_up_db(db)
            
            logging.info("Entrenando motor de recomendaciones...")
            try:
                with db.connect() as conn:
                    query_train = sqlalchemy.text("SELECT id_libro, descripcion FROM libros ORDER BY id_libro DESC")
                    todos_libros = conn.execute(query_train).fetchall()
                    
                    datos_para_entrenar = [
                        {"id_libro": row.id_libro, "descripcion": row.descripcion} 
                        for row in todos_libros
                    ]
                    
                    recomendador.entrenar(datos_para_entrenar)
                    logging.info("¡Motor de recomendaciones entrenado y listo!")
            except Exception as e:
                
                logging.error(f"Error al entrenar el motor de recomendaciones al inicio: {e}")

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

    return app

app = create_app()

project_root = os.path.dirname(os.path.abspath(__file__)) 
static_root = os.path.join(project_root, 'static')
app.wsgi_app = WhiteNoise(app.wsgi_app, root=static_root) 

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get('PORT', 8080)), host='0.0.0.0')
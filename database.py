# database.py
import os
from google.cloud.sql.connector import Connector
import sqlalchemy

def connect_with_connector(app) -> sqlalchemy.engine.base.Engine:
    """
    Crea y retorna un pool de conexiones a la base de datos.
    Recibe 'app' para poder leer la SECRET_KEY desde app.config.
    """
    INSTANCE_CONNECTION_NAME = os.environ.get("INSTANCE_CONNECTION_NAME")
    DB_NAME = os.environ.get("DB_NAME")
    DB_USER = os.environ.get("DB_USER")
    DB_PASS = os.environ.get("DB_PASS")
    DB_DRIVER = "pymysql"
    SECRET_KEY = app.config.get('SECRET_KEY')

    if not all([INSTANCE_CONNECTION_NAME, DB_NAME, DB_USER, DB_PASS, SECRET_KEY]):
        print("Error: Faltan variables de entorno para la base de datos o SECRET_KEY.")
        return None 

    connector = Connector()
    
    def getconn():
        conn = connector.connect(
            INSTANCE_CONNECTION_NAME,
            DB_DRIVER,
            user=DB_USER,
            password=DB_PASS,
            db=DB_NAME
        )
        return conn
        
    pool = sqlalchemy.create_engine("mysql+pymysql://", creator=getconn, pool_timeout=30)
    return pool

def warm_up_db(db_engine):
    """Ejecuta una consulta simple para calentar el pool de conexiones."""
    print("Calentando el pool de conexiones...")
    try:
        with db_engine.connect() as conn:
            conn.execute(sqlalchemy.text("SELECT 1"))
        print("¡Pool calentado y listo!")
    except Exception as e:
        print(f"¡¡ERROR AL CALENTAR EL POOL!!: {e}")
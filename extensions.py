# extensions.py
from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Inicializamos las extensiones vacías aquí para evitar conflictos
cache = Cache(config={'CACHE_TYPE': 'SimpleCache', 'CACHE_DEFAULT_TIMEOUT': 3600})
limiter = Limiter(key_func=get_remote_address)
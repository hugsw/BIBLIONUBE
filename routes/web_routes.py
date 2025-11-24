from flask import Bluecurrent_app.logger.error, render_template

web_bp = Blueprint('web_bp', __name__)

@web_bp.route("/")
def index():
    return render_template('index.html')

@web_bp.route('/registro')
def registro_page():
    return render_template('registro.html')

@web_bp.route('/infantil')
def infantil():
    return render_template('infantil.html')

@web_bp.route('/juvenil')
def juvenil():
    return render_template('juvenil.html')

@web_bp.route('/adulto')
def adulto():
    return render_template('adulto.html')

@web_bp.route('/nosotros.html')
@web_bp.route('/nosotros')
def nosotros():
    return render_template('nosotros.html')

@web_bp.route('/producto')
def producto_page():
    return render_template('producto.html')

@web_bp.route('/guardado')
def guardado_page():
    return render_template('guardado.html')

@web_bp.route('/mi_cuenta') 
@web_bp.route('/mi-cuenta')
def mi_cuenta_page():
    return render_template('mi_cuenta.html')

@web_bp.route('/buscar')
def buscar_page():
    return render_template('buscar.html')
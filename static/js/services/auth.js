// js/services/auth.js

/**
 * Revisa localStorage y actualiza la UI de sesión (muestra/oculta botones).
 */
export function inicializarGestorSesion() {
    const token = localStorage.getItem('authToken');
    const nombre = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');

    const btnLogin = document.getElementById('abrirModal'); // Botón "IDENTIFICATE"
    const menuUsuario = document.getElementById('user-menu-wrapper'); // Contenedor del círculo
    const inicialesUsuario = document.getElementById('user-initials');
    const emailUsuarioDropdown = document.getElementById('user-dropdown-email');
    const body = document.body;

    if (token && nombre && email && menuUsuario && btnLogin && inicialesUsuario && emailUsuarioDropdown) {
        // --- El usuario TIENE sesión ---

        // 1. Calcular Iniciales
        const partesNombre = nombre.split(' ');
        let iniciales = partesNombre[0].substring(0, 2).toUpperCase();

        if (partesNombre.length === 1 && partesNombre[0].length > 0) {
            iniciales = partesNombre[0].substring(0, 2).toUpperCase();
        } else if (partesNombre.length > 1) {
            // Si es "Fabrizio Segura", usa "FS"
            iniciales = partesNombre[0].substring(0, 1) + partesNombre[1].substring(0, 1);
        }

        // 2. Actualizar UI
        inicialesUsuario.textContent = iniciales;
        emailUsuarioDropdown.textContent = email; // Pone el email en el dropdown
        body.classList.add('sesion-iniciada'); // CSS se encarga de ocultar/mostrar

    } else {
        // --- El usuario NO tiene sesión ---
        body.classList.remove('sesion-iniciada'); // CSS se encarga de ocultar/mostrar
    }
}

/**
 * Maneja el envío del formulario de login.
 */
async function submitLoginForm(event) {
    event.preventDefault(); // Evita que la página se recargue

    // 1. Obtener elementos del formulario
    const loginForm = document.getElementById('login-form');
    const emailField = document.getElementById('email-login');
    const passwordFieldLogin = document.getElementById('password-login');
    const errorMsg = document.getElementById('login-error');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const modal = document.getElementById('modalLogin');

    // 2. Deshabilitar botón y limpiar errores
    errorMsg.textContent = '';
    errorMsg.style.display = 'none';
    submitButton.disabled = true;
    submitButton.textContent = 'INGRESANDO...';

    const datosLogin = {
        email: emailField.value,
        password: passwordFieldLogin.value
    };

    try {
        const API_URL = '/login'; // Llama a la ruta de login
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosLogin)
        });

        const data = await response.json();

        if (!response.ok) {
            // Muestra error de la API (ej: "Credenciales inválidas")
            throw new Error(data.error || 'Error, intente de nuevo.');
        }

        // --- ¡ÉXITO! ---
        // 1. Guarda el token, nombre y email en localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userName', data.nombre);
        localStorage.setItem('userEmail', emailField.value); // Guardamos el email

        // 2. Actualiza la UI (cambia "IDENTIFICATE" por el círculo)
        inicializarGestorSesion();

        // 3. Cierra el modal
        if (modal) {
            modal.classList.remove('visible');
            document.body.classList.remove('modal-open');
        }

    } catch (error) {
        // Muestra el error en el párrafo <p id="login-error">
        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';
    } finally {
        // Reactiva el botón
        submitButton.disabled = false;
        submitButton.textContent = 'ENTRAR';
    }
}


/**
 * Maneja el clic en el botón de logout.
 */
function handleLogout() {
    // Borra los datos de sesión
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');

    // Actualiza la UI para mostrar el botón de "IDENTIFICATE"
    inicializarGestorSesion();

    // Opcional: recarga la página para un estado limpio
    window.location.reload();
}

/**
 * Añade los listeners para el formulario de login y el botón de logout.
 */
export function inicializarLogicaAuth() {
    // Listener para el formulario de LOGIN
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        // Llama a la función de ayuda que creamos
        loginForm.addEventListener('submit', submitLoginForm);
    }

    // Listener para el botón de LOGOUT
    const btnLogout = document.getElementById('logout-button');
    if (btnLogout) {
        btnLogout.addEventListener('click', handleLogout);
    }
}


/**
 * Lógica del formulario de registro (solo para registro.html)
 */
export function inicializarFormularioRegistro() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return; // No estamos en la página de registro

    console.log("Formulario de registro inicializado.");

    // --- 1. Obtener todos los elementos del formulario ---
    const nombreCompletoField = document.getElementById('nombre_completo');
    const emailField = document.getElementById('email');
    const docTypeField = document.getElementById('documentType');
    const docNumGroup = document.getElementById('document-number-group');
    const docNumField = document.getElementById('documentNumber');
    const dobField = document.getElementById('dob'); // Es type="date"
    const passField = document.getElementById('password');
    const confirmPassField = document.getElementById('confirmPassword');
    const errorMsg = document.getElementById('passwordError');
    const submitButton = registerForm.querySelector('button[type="submit"]');

    // --- 2. Lógica para mostrar/oculta el número de documento ---
    if (docTypeField) {
        docTypeField.addEventListener('change', () => {
            if (docTypeField.value) { // Si se selecciona algo (dni, passport, ce)
                docNumGroup.style.display = 'block';
            } else { // Si se selecciona "Seleccione Tipo..."
                docNumGroup.style.display = 'none';
            }
        });
    }

    // --- 5. Lógica de validación de Documento (solo números Y límite) ---
    if (docNumField && docTypeField) {
        docNumField.addEventListener('input', (e) => {
            let value = e.target.value;
            value = value.replace(/\D/g, ''); // 1. Quita no-números
            const tipoDoc = docTypeField.value.toUpperCase(); // 2. Obtiene tipo

            // 3. Aplica el límite
            let maxLength = 12; // Límite general
            if (tipoDoc === 'DNI') {
                maxLength = 8;
            }
            if (value.length > maxLength) {
                value = value.slice(0, maxLength);
            }
            
            e.target.value = value; // 4. Asigna valor limpio
        });
    }

    // --- 6. Lógica principal: Interceptar el envío del formulario ---
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // ¡Evita que la página se recargue!

        // --- Validación de Frontend ---
        errorMsg.textContent = ''; // Limpia errores previos
        if (passField.value.length < 6) {
            errorMsg.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            return;
        }
        if (passField.value !== confirmPassField.value) {
            errorMsg.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Registrando...';

        // --- Preparar datos para la API ---
        const datosRegistro = {
            nombre: nombreCompletoField.value,
            email: emailField.value,
            tipo_documento: docTypeField.value,
            numero_documento: docNumField.value,
            fecha_nacimiento: dobField.value, // Envía 'yyyy-mm-dd'
            password: passField.value
        };

        // --- Llamada a la API (Fetch) ---
        try {
            const API_URL = '/registro';

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosRegistro)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en el servidor. Intente más tarde.');
            }

            // --- ¡ÉXITO! ---
            console.log('Registro exitoso:', data);
            
            // Muestra alerta de éxito antes de redirigir
            alert('¡Registro exitoso! Revisa tu correo para activar tu cuenta.');
            window.location.href = '/';

        } catch (error) {
            // --- ¡ERROR! ---
            console.error('Error en el registro:', error);
            errorMsg.textContent = error.message; // Muestra el error (ej: "Email ya existe")
            submitButton.disabled = false; // Reactiva el botón
            submitButton.textContent = 'Regístrese';
        }
    });
}


// ================================================================
//     ### FUNCIÓN "MI CUENTA" (MODIFICADA) ###
// ================================================================

/**
 * Carga los detalles del usuario en la página "Mi Cuenta".
 */
export async function cargarDatosMiCuenta() {
    console.log("Cargando datos de Mi Cuenta...");
    const token = localStorage.getItem('authToken');

    // 1. Si no hay token, no debería estar aquí. Lo echamos.
    if (!token) {
        window.location.href = '/'; // Redirige al inicio
        return;
    }

    try {
        const response = await fetch('/api/mi-cuenta', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // Si el token es inválido o expiró
            if (response.status === 401) {
                localStorage.clear(); // Limpia la sesión
                window.location.href = '/'; // Redirige al inicio
            }
            throw new Error('No se pudieron cargar los datos.');
        }

        const data = await response.json();

        // --- 2. LÓGICA DE INICIALES (AÑADIDA) ---
        const nombre = data.nombre_usuario || "";
        const partesNombre = nombre.split(' ');
        let iniciales = partesNombre[0].substring(0, 2).toUpperCase();

        if (partesNombre.length === 1 && partesNombre[0].length > 0) {
            iniciales = partesNombre[0].substring(0, 2).toUpperCase();
        } else if (partesNombre.length > 1) {
            iniciales = partesNombre[0].substring(0, 1) + partesNombre[1].substring(0, 1);
        }
        // ------------------------------------

        // 3. Formatear fechas (para que se vean bien)
        const formatoFecha = { day: 'numeric', month: 'long', year: 'numeric' };
        
        const fechaNacimiento = data.fecha_nacimiento 
            ? new Date(data.fecha_nacimiento).toLocaleDateString('es-ES', formatoFecha) 
            : 'No especificada';
            
        const fechaRegistro = data.fecha_registro
            ? new Date(data.fecha_registro).toLocaleDateString('es-ES', formatoFecha)
            : 'No especificada';

        // 4. Rellenar el HTML
        document.getElementById('detalle-iniciales').textContent = iniciales; // <-- AÑADIDO
        document.getElementById('detalle-nombre').textContent = data.nombre_usuario;
        document.getElementById('detalle-correo').textContent = data.correo_usuario;
        document.getElementById('detalle-tipo-doc').textContent = data.tipo_documento.toUpperCase();
        document.getElementById('detalle-num-doc').textContent = data.numero_documento;
        document.getElementById('detalle-nacimiento').textContent = fechaNacimiento;
        document.getElementById('detalle-registro').textContent = fechaRegistro;
        document.getElementById('detalle-estado').textContent = data.estado_cuenta === 'activo' ? 'Activa' : 'Pendiente';

    } catch (error) {
        console.error("Error cargando datos de cuenta:", error);
        // Muestra un error en la página
        // (Selector corregido para apuntar a la nueva tarjeta)
        const container = document.querySelector('.profile-card');
        if(container) {
            container.innerHTML = '<h1>Error</h1><p>No se pudieron cargar los detalles de tu cuenta. Por favor, intenta iniciar sesión de nuevo.</p>';
        }
    }
}
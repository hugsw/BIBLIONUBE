// static/js/auth.js

// --- PASO 1: CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyA19ORaIYFCH_vfPfamUjyR9iMxLGT1FVI",
    authDomain: "biblionube-328e4.firebaseapp.com",
    projectId: "biblionube-328e4",
    storageBucket: "biblionube-328e4.firebasestorage.app",
    messagingSenderId: "911996701364",
    appId: "1:911996701364:web:97ff11275b17a91b85a5e1",
    measurementId: "G-VWPDZYGQ88"
};

// --- PASO 2: INICIALIZA FIREBASE ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// --- PASO 3: LÓGICA DE AUTENTICACIÓN GLOBAL ---
document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('login-form');
    const btnLogout = document.getElementById('logout-button');
    const miCuentaCard = document.querySelector('.profile-card');

    // --- ¡LA CORRECCIÓN DEFINITIVA! ---
    // Movemos la lógica del botón "Guardados" aquí.
    const botonGuardados = document.getElementById('boton-guardados');
    const modalLogin = document.getElementById('modalLogin');

    if (botonGuardados && modalLogin) {
        // 1. Asignamos el listener INMEDIATAMENTE al cargar la página.
        botonGuardados.addEventListener('click', (e) => {
            // 2. SIEMPRE prevenimos que el enlace navegue.
            e.preventDefault();

            // 3. Revisamos el estado de Firebase EN EL MOMENTO DEL CLIC.
            // auth.currentUser es síncrono, nos da el usuario actual (o null).
            const user = auth.currentUser;

            if (user && user.emailVerified) {
                // --- Caso 1: Usuario LOGUEADO y VERIFICADO ---
                window.location.href = '/guardado';
            } else {
                // --- Caso 2: Usuario NO logueado (o no verificado) ---
                sessionStorage.setItem('redirectAfterLogin', '/guardado');
                modalLogin.classList.add('visible');
                document.body.classList.add('modal-open');
            }
        });
    }
    // --- FIN DE LA CORRECCIÓN ---


    // onAuthStateChanged AHORA solo se encarga de actualizar la UI
    // (mostrar/ocultar "IDENTIFICATE" vs el círculo de usuario)
    auth.onAuthStateChanged(async (user) => {

        const body = document.body;

        if (user) {
            // --- EL USUARIO TIENE SESIÓN ---
            if (user.emailVerified) {
                // ¡Usuario verificado!
                const nombre = user.displayName || "";
                const email = user.email || "";

                // Calcular Iniciales
                const inicialesUsuario = document.getElementById('user-initials');
                const emailUsuarioDropdown = document.getElementById('user-dropdown-email');
                let iniciales = "";
                const partesNombre = nombre.split(' ').filter(part => part.length > 0);

                if (partesNombre.length > 1) {
                    iniciales = (partesNombre[0].substring(0, 1) + partesNombre[1].substring(0, 1)).toUpperCase();
                } else if (partesNombre.length === 1) {
                    iniciales = partesNombre[0].substring(0, 2).toUpperCase();
                } else if (email) {
                    iniciales = email.substring(0, 2).toUpperCase();
                } else {
                    iniciales = "??";
                }

                // Actualizar UI
                if (inicialesUsuario) inicialesUsuario.textContent = iniciales;
                if (emailUsuarioDropdown) emailUsuarioDropdown.textContent = email;
                body.classList.add('sesion-iniciada');
            }
            else {
                // Usuario registrado pero NO ha verificado su correo
                alert("Por favor, revisa tu correo electrónico para verificar tu cuenta antes de iniciar sesión.");
                auth.signOut(); // Lo deslogueamos
            }

        } else {
            // --- EL USUARIO NO TIENE SESIÓN ---
            body.classList.remove('sesion-iniciada');
        }
    });

    // --- MANEJADOR DEL FORMULARIO DE LOGIN ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm['email-login'].value;
            const password = loginForm['password-login'].value;
            const errorMsg = document.getElementById('login-error');
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const modal = document.getElementById('modalLogin');

            errorMsg.textContent = '';
            submitButton.disabled = true;
            submitButton.textContent = 'INGRESANDO...';

            try {
                await auth.signInWithEmailAndPassword(email, password);
                // ¡Éxito! onAuthStateChanged se encargará de actualizar la UI

                // --- BLOQUE DE REDIRECCIÓN (Esto está correcto) ---
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin');

                if (redirectUrl) {
                    sessionStorage.removeItem('redirectAfterLogin');
                    window.location.href = redirectUrl; // ¡Te lleva a /guardado!
                } else {
                    // Login normal. Solo cierra el modal.
                    if (modal) {
                        modal.classList.remove('visible');
                        document.body.classList.remove('modal-open');
                    }
                }
                // --- FIN DEL BLOQUE ---

            } catch (error) {
                // Maneja errores de Firebase
                if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                    errorMsg.textContent = 'Correo o contraseña incorrectos.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMsg.textContent = 'Demasiados intentos. Intenta más tarde.';
                } else {
                    errorMsg.textContent = 'Error al iniciar sesión.';
                }
                console.error("Error en login:", error);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'ENTRAR';
            }
        });
    }

    // --- MANEJADOR DE LOGOUT ---
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            auth.signOut().then(() => {
                // Recargamos para un estado limpio
                window.location.href = '/'; // Redirige al index al cerrar sesión
            });
        });
    }

    // --- MANEJADOR DE "MI CUENTA" ---
    // Si estamos en la página de "Mi Cuenta", carga los datos
    if (miCuentaCard) {
        cargarDatosMiCuenta();
    }
});


/**
 * Carga los detalles del usuario en la página "Mi Cuenta".
 */
async function cargarDatosMiCuenta() {
    console.log("Cargando datos de Mi Cuenta...");

    const user = auth.currentUser; // Obtiene el usuario de Firebase

    // 1. Si no hay usuario, lo echamos.
    if (!user) {
        window.location.href = '/'; // Redirige al inicio
        return;
    }

    // ¡Obtiene el token de Firebase!
    const token = await user.getIdToken();

    try {
        const response = await fetch('/api/mi-cuenta', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // Envía el token de Firebase
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                auth.signOut(); // Si el token es inválido, deslogueamos
                window.location.href = '/';
            }
            throw new Error('No se pudieron cargar los datos.');
        }

        const data = await response.json();

        // --- 2. LÓGICA DE INICIALES ---
        const nombre = data.nombre_usuario || "";
        const partesNombre = nombre.split(' ').filter(part => part.length > 0);
        let iniciales = "";

        if (partesNombre.length > 1) {
            iniciales = (partesNombre[0].substring(0, 1) + partesNombre[1].substring(0, 1)).toUpperCase();
        } else if (partesNombre.length === 1) {
            iniciales = partesNombre[0].substring(0, 2).toUpperCase();
        }
        // ------------------------------------

        // 3. Formatear fechas
        const formatoFecha = { day: 'numeric', month: 'long', year: 'numeric' };

        const fechaNacimiento = data.fecha_nacimiento
            ? new Date(data.fecha_nacimiento).toLocaleDateString('es-ES', formatoFecha)
            : 'No especificada';

        const fechaRegistro = data.fecha_registro
            ? new Date(data.fecha_registro).toLocaleDateString('es-ES', formatoFecha)
            : 'No especificada';

        // 4. Rellenar el HTML
        document.getElementById('detalle-iniciales').textContent = iniciales;
        document.getElementById('detalle-nombre').textContent = data.nombre_usuario;
        document.getElementById('detalle-correo').textContent = data.correo_usuario;
        document.getElementById('detalle-tipo-doc').textContent = data.tipo_documento.toUpperCase();
        document.getElementById('detalle-num-doc').textContent = data.numero_documento;
        document.getElementById('detalle-nacimiento').textContent = fechaNacimiento;
        document.getElementById('detalle-registro').textContent = fechaRegistro;
        document.getElementById('detalle-estado').textContent = data.estado_cuenta === 'activo' ? 'Activa' : 'Pendiente';

    } catch (error) {
        console.error("Error cargando datos de cuenta:", error);
        const container = document.querySelector('.profile-card');
        if (container) {
            container.innerHTML = '<h1>Error</h1><p>No se pudieron cargar los detalles de tu cuenta. Por favor, intenta iniciar sesión de nuevo.</p>';
        }
    }
}
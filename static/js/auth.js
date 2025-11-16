// static/js/auth.js

// --- PASO 1: PEGA TU CÓDIGO DE FIREBASE CONFIG AQUÍ ---
// (¡El mismo que usaste en registro.js!)
const firebaseConfig = {
  apiKey: "AIzaSy...xxxxxxxxxxxx", // ¡Pega el tuyo!
  authDomain: "biblionube-xxxx.firebaseapp.com", // ¡Pega el tuyo!
  projectId: "biblionube-xxxx", // ¡Pega el tuyo!
  storageBucket: "biblionube-xxxx.appspot.com", // ¡Pega el tuyo!
  messagingSenderId: "...", // ¡Pega el tuyo!
  appId: "1:..." // ¡Pega el tuyo!
};

// --- PASO 2: INICIALIZA FIREBASE ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// --- PASO 3: LÓGICA DE AUTENTICACIÓN GLOBAL ---
document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('login-form');
    const btnLogout = document.getElementById('logout-button');
    const miCuentaCard = document.querySelector('.profile-card');

    // ESTA ES LA FUNCIÓN MÁS IMPORTANTE
    // Se ejecuta al cargar la página y cada vez que el usuario
    // inicia o cierra sesión. Reemplaza tu 'inicializarGestorSesion'.
    auth.onAuthStateChanged(async (user) => {
        
        // Obtenemos los elementos de la UI
        const body = document.body;
        const btnLogin = document.getElementById('abrirModal'); // Botón "IDENTIFICATE"
        const menuUsuario = document.getElementById('user-menu-wrapper'); // Contenedor del círculo

        if (user) {
            // --- EL USUARIO TIENE SESIÓN ---
            
            // 1. Revisamos si verificó su correo
            if (user.emailVerified) {
                // ¡Usuario verificado!
                const nombre = user.displayName;
                const email = user.email;

                // 2. Calcular Iniciales (como en tu código antiguo)
                const inicialesUsuario = document.getElementById('user-initials');
                const emailUsuarioDropdown = document.getElementById('user-dropdown-email');
                
                let iniciales = nombre ? nombre.substring(0, 2).toUpperCase() : email.substring(0, 2).toUpperCase();
                const partesNombre = nombre ? nombre.split(' ') : [];
                if (partesNombre.length === 1 && partesNombre[0].length > 0) {
                    iniciales = partesNombre[0].substring(0, 2).toUpperCase();
                } else if (partesNombre.length > 1) {
                    iniciales = partesNombre[0].substring(0, 1) + partesNombre[1].substring(0, 1);
                }

                // 3. Actualizar UI
                if (inicialesUsuario) inicialesUsuario.textContent = iniciales;
                if (emailUsuarioDropdown) emailUsuarioDropdown.textContent = email;
                body.classList.add('sesion-iniciada');

            } else {
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
                // ¡AQUÍ ESTÁ LA MAGIA!
                // Llama a Firebase para iniciar sesión
                await auth.signInWithEmailAndPassword(email, password);
                
                // ¡Éxito! onAuthStateChanged se encargará de actualizar la UI
                
                // 3. Cierra el modal
                if (modal) {
                    modal.classList.remove('visible');
                    document.body.classList.remove('modal-open');
                }

            } catch (error) {
                // Maneja errores de Firebase (ej. auth/wrong-password)
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
                // onAuthStateChanged se encargará de limpiar la UI
                // Recargamos para un estado limpio
                window.location.reload();
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
 * (Tu código antiguo, pero modificado para obtener el token de Firebase)
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

        // --- 2. LÓGICA DE INICIALES (Tu código original) ---
        const nombre = data.nombre_usuario || "";
        const partesNombre = nombre.split(' ');
        let iniciales = partesNombre[0].substring(0, 2).toUpperCase();

        if (partesNombre.length === 1 && partesNombre[0].length > 0) {
            iniciales = partesNombre[0].substring(0, 2).toUpperCase();
        } else if (partesNombre.length > 1) {
            iniciales = partesNombre[0].substring(0, 1) + partesNombre[1].substring(0, 1);
        }
        // ------------------------------------

        // 3. Formatear fechas (Tu código original)
        const formatoFecha = { day: 'numeric', month: 'long', year: 'numeric' };
        
        const fechaNacimiento = data.fecha_nacimiento 
            ? new Date(data.fecha_nacimiento).toLocaleDateString('es-ES', formatoFecha) 
            : 'No especificada';
            
        const fechaRegistro = data.fecha_registro
            ? new Date(data.fecha_registro).toLocaleDateString('es-ES', formatoFecha)
            : 'No especificada';

        // 4. Rellenar el HTML (Tu código original)
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
        if(container) {
            container.innerHTML = '<h1>Error</h1><p>No se pudieron cargar los detalles de tu cuenta. Por favor, intenta iniciar sesión de nuevo.</p>';
        }
    }
}
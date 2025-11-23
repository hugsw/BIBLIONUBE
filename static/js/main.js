import {
    cargarYRenderizarLibros,
    cargarProductoUnico,
    inicializarBotonGuardar,
    cargarLibrosGuardados,
    inicializarDelegacionEliminar,
    cargarResultadosBusqueda
} from './services/books.js';

import {
    inicializarSliders,
    inicializarModalLogin,
    inicializarBarraBusqueda,
    inicializarTogglePasswordLogin,
    inicializarTogglePasswordRegistro,
    inicializarDropdownUsuario
} from './components/ui.js';

import { auth } from './config/firebase-config.js';

document.addEventListener("DOMContentLoaded", async () => {

    inicializarModalLogin();
    inicializarBarraBusqueda();
    inicializarBotonGuardar(); 
    inicializarTogglePasswordLogin(); 
    inicializarDropdownUsuario();
    console.log("Lógica del Header y UI inicializada.");

    if (document.getElementById('register-form')) {
        inicializarRegistroFirebase();
        inicializarTogglePasswordRegistro(); 
        console.log("Formulario de Registro (Firebase) inicializado.");
    }

    if (document.querySelector('.slider-contenedor')) {
        inicializarSliders();
        console.log("Sliders inicializados.");
    }

    cargarYRenderizarLibros();
    console.log("Carga de libros (general) iniciada.");

    await cargarProductoUnico();
    console.log("Carga de (producto único) completada.");

    inicializarDelegacionEliminar(document.getElementById('grid-guardados')); 
    console.log("Página 'Guardados' cargada y renderizada.");

    if (document.body.classList.contains('pagina-mi-cuenta')) {
        await cargarDatosMiCuentaFirebase();
        console.log("Página 'Mi Cuenta' (Firebase) cargada.");
    }

    await cargarResultadosBusqueda();

});

function inicializarFirebaseGlobal() {
    console.log("🟢 'inicializarFirebaseGlobal' SÍ se está llamando.");

    const loginForm = document.getElementById('login-form');
    const btnLogout = document.getElementById('logout-button');

    auth.onAuthStateChanged(async (user) => {
        console.log("🟡 'onAuthStateChanged' se disparó.");
        const body = document.body;
        
        const esPaginaGuardados = document.getElementById('grid-guardados');

        if (user) {
            console.log("✅ Usuario ENCONTRADO:", user.email);

            if (user.emailVerified) {
                console.log("➡️ Entrando al camino 'VERIFICADO'.");

                const nombre = user.displayName;
                const email = user.email;

                const inicialesUsuario = document.getElementById('user-initials');
                const emailUsuarioDropdown = document.getElementById('user-dropdown-email');

                let iniciales = "??";
                if (nombre) {
                    const partesNombre = nombre.split(' ');
                    if (partesNombre.length === 1 && partesNombre[0].length > 0) {
                        iniciales = partesNombre[0].substring(0, 2).toUpperCase();
                    } else if (partesNombre.length > 1) {
                        iniciales = partesNombre[0].substring(0, 1) + partesNombre[1].substring(0, 1);
                    }
                } else if (email) {
                    iniciales = email.substring(0, 2).toUpperCase();
                }

                if (inicialesUsuario) inicialesUsuario.textContent = iniciales;
                if (emailUsuarioDropdown) emailUsuarioDropdown.textContent = email;

                body.classList.add('sesion-iniciada');

                if (esPaginaGuardados) {
                    console.log("📚 Cargando libros guardados...");
                    await cargarLibrosGuardados();
                }

            } else {
                console.warn("➡️ Entrando al camino 'NO VERIFICADO'. (Cerrando sesión)");
                auth.signOut();
                body.classList.remove('sesion-iniciada');
            }
        } else {
            console.log("❌ NO hay usuario (sesión cerrada o estado inicial).");
            body.classList.remove('sesion-iniciada');

            if (esPaginaGuardados) {
                await cargarLibrosGuardados();
            }
        }
    });

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
                const userCredential = await auth.signInWithEmailAndPassword(email, password);

                if (!userCredential.user.emailVerified) {
                    auth.signOut();
                    throw new Error("Por favor, verifica tu correo electrónico antes de iniciar sesión.");
                }

                if (modal) {
                    modal.classList.remove('visible');
                    document.body.classList.remove('modal-open');
                }
            } catch (error) {
                if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                    errorMsg.textContent = 'Correo o contraseña incorrectos.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMsg.textContent = 'Demasiados intentos. Intenta más tarde.';
                } else {
                    errorMsg.textContent = error.message;
                }
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'ENTRAR';
            }
        });
    }
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.reload();
            });
        });
    }
}

function inicializarRegistroFirebase() {
    const registerForm = document.getElementById('register-form');
    const passwordError = document.getElementById('passwordError');
    const docTypeSelect = document.getElementById('tipo_documento');
    const docNumGroup = document.getElementById('document-number-group');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            passwordError.textContent = '';

            const nombre = registerForm.nombre.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;
            const tipo_documento = registerForm.tipo_documento.value;
            const numero_documento = registerForm.numero_documento.value;
            const fecha_nacimiento = registerForm.fecha_nacimiento.value;

            if (password !== confirmPassword) {
                passwordError.textContent = 'Las contraseñas no coinciden.';
                return;
            }
            if (password.length < 6) {
                passwordError.textContent = 'La contraseña debe tener al menos 6 caracteres.';
                return;
            }

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                await user.updateProfile({ displayName: nombre });
                await user.sendEmailVerification();

                const token = await user.getIdToken(); 

                const response = await fetch('/api/crear-perfil', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nombre: nombre,
                        email: email,
                        tipo_documento: tipo_documento,
                        numero_documento: numero_documento,
                        fecha_nacimiento: fecha_nacimiento
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    await user.delete();
                    throw new Error(errorData.error || 'Error al guardar el perfil en el backend.');
                }

                alert('¡Registro exitoso! Revisa tu correo electrónico para verificar tu cuenta.');
                window.location.href = '/'; 

            } catch (error) {
                if (error.code === 'auth/email-already-in-use') {
                    passwordError.textContent = 'Este correo electrónico ya está registrado.';
                } else {
                    passwordError.textContent = `Error: ${error.message}`;
                }
            }
        });
    }
}

async function cargarDatosMiCuentaFirebase() {
    console.log("Cargando datos de Mi Cuenta (Firebase)...");

    const user = auth.currentUser;

    if (!user) {
        setTimeout(() => {
            const userCheck = auth.currentUser;
            if (!userCheck) {
                console.warn("No hay usuario, redirigiendo al inicio.");
                window.location.href = '/';
            } else {
                cargarDatosMiCuentaFirebase();
            }
        }, 1000);
        return;
    }

    const token = await user.getIdToken();

    try {
        const response = await fetch('/api/mi-cuenta', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                auth.signOut();
                window.location.href = '/';
            }
            throw new Error('No se pudieron cargar los datos.');
        }

        const data = await response.json();

        const nombre = data.nombre_usuario || "";
        const partesNombre = nombre.split(' ');
        let iniciales = partesNombre[0].substring(0, 2).toUpperCase();
        if (partesNombre.length === 1 && partesNombre[0].length > 0) {
            iniciales = partesNombre[0].substring(0, 2).toUpperCase();
        } else if (partesNombre.length > 1) {
            iniciales = partesNombre[0].substring(0, 1) + partesNombre[1].substring(0, 1);
        }

        const formatoFecha = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
        
        const fechaNacimiento = data.fecha_nacimiento
            ? new Date(data.fecha_nacimiento).toLocaleDateString('es-ES', formatoFecha)
            : 'No especificada';
            
        const fechaRegistro = data.fecha_registro
            ? new Date(data.fecha_registro).toLocaleDateString('es-ES', formatoFecha)
            : 'No especificada';

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
        const container = document.querySelector('.contenido-mi-cuenta');
        if (container) {
        }
    }
}

inicializarFirebaseGlobal();
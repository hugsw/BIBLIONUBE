// js/components/ui.js

/**
 * Añade listeners a los botones de flecha de TODOS los sliders
 * (Extraído de tu 'inicializarSliders')
 */
export function inicializarSliders() {
    const todosLosSliders = document.querySelectorAll('.slider-contenedor');
    todosLosSliders.forEach(slider => {
        const sliderTrack = slider.querySelector('.slider-track');
        const prevBtn = slider.querySelector('.slider-btn--prev');
        const nextBtn = slider.querySelector('.slider-btn--next');

        if (sliderTrack && prevBtn && nextBtn) {
            const getScrollAmount = () => {
                const firstItem = sliderTrack.querySelector('.producto');
                if (!firstItem) return 300;
                return firstItem.offsetWidth + 32; // Ancho + gap
            };
            nextBtn.addEventListener('click', () => {
                sliderTrack.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            });
            prevBtn.addEventListener('click', () => {
                sliderTrack.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
            });
        }
    });
}

/**
 * Inicializa la lógica para abrir/cerrar el modal de login.
 * (Extraído de tu 'inicializarScriptsDelHeader')
 */
export function inicializarModalLogin() {
    const modal = document.getElementById('modalLogin');
    const btnAbrir = document.getElementById('abrirModal');
    const btnCerrar = document.getElementById('cerrarModal');

    if (modal && btnAbrir && btnCerrar) {
        btnAbrir.onclick = () => {
            modal.classList.add('visible');
            document.body.classList.add('modal-open');
        }
        btnCerrar.onclick = () => {
            modal.classList.remove('visible');
            document.body.classList.remove('modal-open');
        }
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.classList.remove('visible');
                document.body.classList.remove('modal-open');
            }
        }
    }
}



export function inicializarBarraBusqueda() {
    const formBusqueda = document.getElementById('form-busqueda');
    const inputBusqueda = document.getElementById('search-input');
    // Buscamos el botón dentro del formulario
    const btnBusqueda = formBusqueda.querySelector('button[type="submit"]');

    if (!formBusqueda || !inputBusqueda || !btnBusqueda) return;

    // 1. Lógica del clic en el botón (Lupa)
    btnBusqueda.addEventListener('click', (e) => {
        // Si el input NO tiene la clase activo (está cerrado) o está vacío...
        if (!formBusqueda.classList.contains('activo') || inputBusqueda.value.trim() === "") {
            e.preventDefault(); // ¡DETENEMOS EL ENVÍO!
            
            // Expandimos el buscador
            formBusqueda.classList.add('activo');
            inputBusqueda.focus(); // Ponemos el cursor para escribir
        }
        // Si YA tiene la clase activo Y tiene texto, dejamos que el evento 'submit' ocurra normalmente.
    });

    // 2. Lógica para cerrar si haces clic fuera (Opcional pero recomendado)
    document.addEventListener('click', (e) => {
        if (!formBusqueda.contains(e.target)) {
            // Si el clic fue fuera del formulario y el input está vacío, ciérralo
            if (inputBusqueda.value.trim() === "") {
                formBusqueda.classList.remove('activo');
            }
        }
    });

    // 3. El evento submit real (que redirige)
    formBusqueda.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const query = inputBusqueda.value.trim();
        
        if (query) {
            window.location.href = `/buscar?query=${encodeURIComponent(query)}`;
        }
    });
}

/**
 * Inicializa el botón "Guardados". Si el usuario no está logueado,
 * abre el modal de login.
 * (Extraído de tu 'inicializarScriptsDelHeader')
 
export function inicializarBotonGuardados() {
    const botonGuardados = document.getElementById('boton-guardados');
    const modal = document.getElementById('modalLogin'); // Dependencia

    if (botonGuardados && modal) {
        botonGuardados.addEventListener('click', (event) => {
            event.preventDefault();
            const token = localStorage.getItem('authToken');
            if (token) {
                window.location.href = '/guardado';
            } else {
                // --- ¡CORRECCIÓN! ---
                // 1. Guarda la página a la que el usuario quería ir.
                sessionStorage.setItem('redirectAfterLogin', '/guardado');

                // 2. Ahora sí, abre el modal.
                modal.classList.add('visible');
                document.body.classList.add('modal-open');
            }
        });
    }
}*/

/**
 * Inicializa el "ojo" para ver contraseña EN EL MODAL DE LOGIN.
 * (Extraído de tu 'inicializarScriptsDelHeader')
 */
export function inicializarTogglePasswordLogin() {
    const passwordField = document.querySelector('#login-form #password-login');
    const toggleButton = document.querySelector('#login-form .toggle-password');

    if (passwordField && toggleButton) {
        toggleButton.addEventListener('click', function () {
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);

            const icon = this.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }
}

/**
 * Inicializa el "ojo" para ver contraseñas EN LA PÁGINA DE REGISTRO.
 * (Extraído de tu 'inicializarFormularioRegistro')
 */
export function inicializarTogglePasswordRegistro() {
    const passField = document.getElementById('password');
    const confirmPassField = document.getElementById('confirmPassword');
    const togglePassButton = document.getElementById('toggleAllPasswords');

    if (togglePassButton && passField && confirmPassField) {
        togglePassButton.addEventListener('click', () => {
            const isPassword = passField.type === 'password';
            const newType = isPassword ? 'text' : 'password';
            const newIcon = isPassword ? 'fa-eye-slash' : 'fa-eye';

            passField.type = newType;
            confirmPassField.type = newType; // Afecta a ambos campos

            togglePassButton.classList.remove('fa-eye', 'fa-eye-slash');
            togglePassButton.classList.add(newIcon);
        });
    }
}


/**
 * Inicializa el menú desplegable del usuario (círculo con iniciales).
 * (Extraído de tu 'inicializarScriptsDelHeader')
 */
export function inicializarDropdownUsuario() {
    const menuWrapper = document.getElementById('user-menu-wrapper');
    const menuTrigger = document.getElementById('user-menu-trigger');

    if (menuWrapper && menuTrigger) {
        // Abre/cierra el menú al hacer clic en el círculo
        menuTrigger.addEventListener('click', (event) => {
            event.stopPropagation(); // Evita que el clic se propague al 'document'
            menuWrapper.classList.toggle('dropdown-active');
        });

        // Cierra el menú si se hace clic en cualquier otro lugar
        document.addEventListener('click', (event) => {
            if (menuWrapper.classList.contains('dropdown-active') && !menuWrapper.contains(event.target)) {
                menuWrapper.classList.remove('dropdown-active');
            }
        });
    }
}
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


/**
 * Inicializa la barra de búsqueda con la lógica de "flotar" para evitar saltos en móvil.
 */
export function inicializarBarraBusqueda() {
    const formBusqueda = document.getElementById('form-busqueda');
    const inputBusqueda = document.getElementById('search-input');
    // Buscamos el botón dentro del formulario de forma segura
    const btnBusqueda = formBusqueda ? formBusqueda.querySelector('button[type="submit"]') : null;

    if (!formBusqueda || !inputBusqueda || !btnBusqueda) return;

    // FUNCIÓN PARA ABRIR EL BUSCADOR
    const abrirBuscador = () => {
        // 1. Primero lo hacemos flotar (posición absoluta) para que no empuje nada
        formBusqueda.classList.add('busqueda-flotante');
        
        // 2. Un instante después, expandimos el ancho (animación CSS)
        // Usamos requestAnimationFrame para asegurar que el navegador procese la clase anterior primero
        requestAnimationFrame(() => {
            formBusqueda.classList.add('activo');
            inputBusqueda.focus(); // Ponemos el cursor para escribir
        });
    };

    // FUNCIÓN PARA CERRAR EL BUSCADOR CON RETRASO (La clave del arreglo)
    const cerrarBuscador = () => {
        // 1. Quitamos la clase 'activo' para que empiece a encogerse (animación de ancho)
        formBusqueda.classList.remove('activo');

        // 2. ESPERAMOS 500ms (tiempo aprox de la animación CSS) antes de dejar de flotar.
        // Esto evita que el buscador "vuelva" a la fila mientras todavía es ancho.
        setTimeout(() => {
            // Solo si sigue cerrado (por si el usuario le dio click rápido de nuevo)
            if (!formBusqueda.classList.contains('activo')) {
                formBusqueda.classList.remove('busqueda-flotante');
            }
        }, 500); // 500ms coincide con la duración típica de transición CSS
    };

    // 1. Lógica del clic en el botón (Lupa)
    btnBusqueda.addEventListener('click', (e) => {
        // Si el input NO tiene la clase activo (está cerrado) o está vacío...
        if (!formBusqueda.classList.contains('activo') || inputBusqueda.value.trim() === "") {
            e.preventDefault(); // ¡DETENEMOS EL ENVÍO!
            abrirBuscador();
        }
        // Si YA tiene la clase activo Y tiene texto, dejamos que el evento 'submit' ocurra normalmente.
    });

    // 2. Lógica para cerrar si haces clic fuera
    document.addEventListener('click', (e) => {
        // Si el clic NO fue dentro del formulario
        if (!formBusqueda.contains(e.target)) {
            // Y si el input está vacío (si tiene texto, no cerramos para no perder la búsqueda)
            if (inputBusqueda.value.trim() === "") {
                // Si está abierto, lo cerramos
                if (formBusqueda.classList.contains('activo')) {
                    cerrarBuscador();
                }
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
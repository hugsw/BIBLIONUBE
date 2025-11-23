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
                return firstItem.offsetWidth + 32;
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
    const btnBusqueda = formBusqueda ? formBusqueda.querySelector('button[type="submit"]') : null;

    if (!formBusqueda || !inputBusqueda || !btnBusqueda) return;
    const abrirBuscador = () => {
        formBusqueda.classList.add('busqueda-flotante');
        requestAnimationFrame(() => {
            formBusqueda.classList.add('activo');
            inputBusqueda.focus();
        });
    };

    const cerrarBuscador = () => {
        formBusqueda.classList.remove('activo');
        setTimeout(() => {
            if (!formBusqueda.classList.contains('activo')) {
                formBusqueda.classList.remove('busqueda-flotante');
            }
        }, 500);
    };

    btnBusqueda.addEventListener('click', (e) => {
        if (!formBusqueda.classList.contains('activo') || inputBusqueda.value.trim() === "") {
            e.preventDefault();
            abrirBuscador();
        }
    });

    document.addEventListener('click', (e) => {
        if (!formBusqueda.contains(e.target)) {
            if (inputBusqueda.value.trim() === "") {
                if (formBusqueda.classList.contains('activo')) {
                    cerrarBuscador();
                }
            }
        }
    });

    formBusqueda.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const query = inputBusqueda.value.trim();
        
        if (query) {
            window.location.href = `/buscar?query=${encodeURIComponent(query)}`;
        }
    });
}

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
            confirmPassField.type = newType;

            togglePassButton.classList.remove('fa-eye', 'fa-eye-slash');
            togglePassButton.classList.add(newIcon);
        });
    }
}

export function inicializarDropdownUsuario() {
    const menuWrapper = document.getElementById('user-menu-wrapper');
    const menuTrigger = document.getElementById('user-menu-trigger');

    if (menuWrapper && menuTrigger) {
        menuTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            menuWrapper.classList.toggle('dropdown-active');
        });

        document.addEventListener('click', (event) => {
            if (menuWrapper.classList.contains('dropdown-active') && !menuWrapper.contains(event.target)) {
                menuWrapper.classList.remove('dropdown-active');
            }
        });
    }
}
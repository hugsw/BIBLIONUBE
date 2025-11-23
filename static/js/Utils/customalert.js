function _ensureModalInDOM() {
    if (document.getElementById('custom-alert-overlay')) {
        return;
    }

    const modalHtml = `
        <div class="custom-modal-overlay" id="custom-alert-overlay">
            <div class="custom-modal">
                <p id="custom-alert-message">Mensaje de alerta.</p>
                <div class="custom-modal-footer">
                    <button class="custom-modal-btn btn-cancel" id="custom-alert-cancel">Cancelar</button>
                    <button class="custom-modal-btn btn-confirm" id="custom-alert-confirm">Aceptar</button>
                </div>
            </div>
        </div>
    `;

    if (document.body) {
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } else {
        console.error("Error: Intentando inyectar modal antes de que exista el body. Usando alert() nativo.");
    }
}

export async function mostrarAlerta(mensaje) {

    _ensureModalInDOM();

    await new Promise(resolve => setTimeout(resolve, 0));

    const overlay = document.getElementById('custom-alert-overlay');
    const messageEl = document.getElementById('custom-alert-message');
    const confirmBtn = document.getElementById('custom-alert-confirm');
    const cancelBtn = document.getElementById('custom-alert-cancel');

    if (!overlay || !messageEl || !confirmBtn || !cancelBtn) {
        console.error("El HTML del modal de alerta no se ha cargado correctamente (fallback nativo).");
        alert(mensaje);
        return;
    }

    messageEl.textContent = mensaje;
    cancelBtn.style.display = 'none';
    confirmBtn.style.display = 'inline-block';

    setTimeout(() => overlay.classList.add('visible'), 10);

    return new Promise((resolve) => {
        confirmBtn.addEventListener('click', () => {
            overlay.classList.remove('visible');
            resolve(true);
        }, { once: true });
    });
}

export async function mostrarConfirmacion(pregunta) {
    _ensureModalInDOM();

    await new Promise(resolve => setTimeout(resolve, 0));

    const overlay = document.getElementById('custom-alert-overlay');
    const messageEl = document.getElementById('custom-alert-message');
    const confirmBtn = document.getElementById('custom-alert-confirm');
    const cancelBtn = document.getElementById('custom-alert-cancel');

    if (!overlay || !messageEl || !confirmBtn || !cancelBtn) {
        console.error("El HTML del modal de alerta no se ha cargado correctamente (fallback nativo).");
        return Promise.resolve(confirm(pregunta));
    }

    messageEl.textContent = pregunta;
    cancelBtn.style.display = 'inline-block';
    confirmBtn.style.display = 'inline-block';

    setTimeout(() => overlay.classList.add('visible'), 10);

    return new Promise((resolve) => {
        confirmBtn.addEventListener('click', () => {
            overlay.classList.remove('visible');
            resolve(true);
        }, { once: true });

        cancelBtn.addEventListener('click', () => {
            overlay.classList.remove('visible');
            resolve(false);
        }, { once: true });
    });
}
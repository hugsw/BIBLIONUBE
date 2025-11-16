/**
 * ¡NUEVA FUNCIÓN DE AYUDA!
 * Esta función revisa si el modal está en el DOM.
 * Si no lo está, inyecta el HTML de forma síncrona.
 */
function _ensureModalInDOM() {
    // Si el modal ya existe, no hace nada.
    if (document.getElementById('custom-alert-overlay')) {
        return;
    }

    // --- 2. Inyectar el HTML del modal ---
    // ¡ESTA ES LA CORRECCIÓN! El HTML estaba incompleto.
    // El 'style' en línea se ha eliminado correctamente.
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
        // En un escenario real, esto solo ocurriría si el script se llama en el <head>
        console.error("Error: Intentando inyectar modal antes de que exista el body. Usando alert() nativo.");
    }
}

// --- ¡CORRECCIÓN CLAVE REALIZADA! ---
// Se ha ELIMINADO la dependencia de document.addEventListener('DOMContentLoaded', _ensureModalInDOM).
// Ahora _ensureModalInDOM() se llama directamente en la primera línea de las funciones exportadas.


/**
 * Muestra una alerta simple (solo botón "Aceptar").
 * @param {string} mensaje El texto a mostrar.
 */
export async function mostrarAlerta(mensaje) {
    // Llamada síncrona para asegurar que el HTML del modal exista antes de intentar usarlo.
    _ensureModalInDOM();

    // Pequeña espera para asegurar que el DOM se actualice
    await new Promise(resolve => setTimeout(resolve, 0));

    const overlay = document.getElementById('custom-alert-overlay');
    const messageEl = document.getElementById('custom-alert-message');
    const confirmBtn = document.getElementById('custom-alert-confirm');
    const cancelBtn = document.getElementById('custom-alert-cancel');

    if (!overlay || !messageEl || !confirmBtn || !cancelBtn) {
        console.error("El HTML del modal de alerta no se ha cargado correctamente (fallback nativo).");
        // Si falla, hacemos una alerta nativa de fallback
        alert(mensaje);
        return;
    }

    messageEl.textContent = mensaje;
    cancelBtn.style.display = 'none';
    confirmBtn.style.display = 'inline-block';

    // Agrega la clase 'visible' para mostrar el modal
    setTimeout(() => overlay.classList.add('visible'), 10);

    return new Promise((resolve) => {
        // Usa { once: true } para remover el listener automáticamente
        confirmBtn.addEventListener('click', () => {
            overlay.classList.remove('visible');
            resolve(true);
        }, { once: true });
    });
}

/**
 * Muestra una confirmación (Aceptar/Cancelar) y devuelve una promesa.
 * @param {string} pregunta El texto a mostrar.
 * @returns {Promise<boolean>} Resuelve 'true' si se acepta, 'false' si se cancela.
 */
export async function mostrarConfirmacion(pregunta) {
    // Llamada síncrona para asegurar que el HTML del modal exista antes de intentar usarlo.
    _ensureModalInDOM();

    await new Promise(resolve => setTimeout(resolve, 0));

    const overlay = document.getElementById('custom-alert-overlay');
    const messageEl = document.getElementById('custom-alert-message');
    const confirmBtn = document.getElementById('custom-alert-confirm');
    const cancelBtn = document.getElementById('custom-alert-cancel');

    if (!overlay || !messageEl || !confirmBtn || !cancelBtn) {
        console.error("El HTML del modal de alerta no se ha cargado correctamente (fallback nativo).");
        return Promise.resolve(confirm(pregunta)); // Fallback a nativo
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
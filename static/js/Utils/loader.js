// js/utils/loader.js

/**
 * Carga el header.html y footer.html en sus contenedores.
 * Devuelve una Promise que se resuelve cuando los componentes están cargados.
 * (Modificado de tu 'cargarComponentes')
 */
export function cargarComponentes() {
    const headerContainer = document.getElementById('header-container');
    const footerContainer = document.getElementById('footer-container');

    // Si no hay #header-container, asume que el header está en el HTML.
    // Resolvemos la promesa inmediatamente.
    if (!headerContainer) {
        console.warn("No se encontró #header-container. Asumiendo header estático.");
        // Devuelve una promesa que se resuelve de inmediato
        return Promise.resolve();
    }

    
}
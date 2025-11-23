
export function cargarComponentes() {
    const headerContainer = document.getElementById('header-container');
    const footerContainer = document.getElementById('footer-container');

    if (!headerContainer) {
        console.warn("No se encontró #header-container. Asumiendo header estático.");
        return Promise.resolve();
    }

    
}
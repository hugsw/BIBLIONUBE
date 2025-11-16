// js/main.js

// 1. Importar todo lo que necesitamos de los otros archivos
import { cargarComponentes } from './Utils/loader.js'; // Corregido a 'Utils' con U mayúscula
import {
    inicializarGestorSesion,
    inicializarLogicaAuth,
    inicializarFormularioRegistro,
    cargarDatosMiCuenta // <--- AÑADIDA (1/2): Importamos la nueva función
} from './services/auth.js';

// --- ¡CORRECCIÓN AQUÍ! ---
// Importamos las nuevas funciones que creamos
import {
    cargarYRenderizarLibros,
    cargarProductoUnico,      // <--- AÑADIDA
    inicializarBotonGuardar,  // <--- AÑADIDA
    cargarLibrosGuardados     // <--- AÑADIDA
} from './services/books.js';

import {
    inicializarSliders,
    inicializarModalLogin,
    inicializarBarraBusqueda,
    inicializarBotonGuardados,
    inicializarTogglePasswordLogin,
    inicializarTogglePasswordRegistro,
    inicializarDropdownUsuario
} from './components/ui.js';


// 2. Esperar a que el DOM (todo el HTML) esté listo
document.addEventListener("DOMContentLoaded", async () => {

    // 1. Carga componentes reutilizables (header/footer)
    try {
        await cargarComponentes();
        console.log("Header y Footer cargados.");
    } catch (error) {
        console.error("Fallo crítico: No se pudieron cargar los componentes. Deteniendo inicialización.", error);
        return; // Detiene la ejecución si el header/footer falla
    }

    // 2. Inicializar toda la lógica que DEPENDE del header
    inicializarLogicaHeader();
    console.log("Lógica del Header inicializada.");

    // 3. Lógica solo para el formulario de registro (si existe)
    if (document.getElementById('register-form')) {
        inicializarFormularioRegistro();
        inicializarTogglePasswordRegistro(); // El "ojo" de la pág. de registro
        console.log("Formulario de Registro inicializado.");
    }

    if (document.querySelector('.slider-contenedor')) {
        inicializarSliders();
        console.log("Sliders inicializados.");
    }

    // 5. Lógica para cargar libros (Sliders y Grids de Categoría)
    cargarYRenderizarLibros();
    console.log("Carga de libros (general) iniciada.");


    // --- ¡CORRECCIÓN AQUÍ! ---
    // Añadimos las llamadas a las nuevas funciones

    // 6. Carga los datos de 'producto.html' (si estamos en esa página)
    await cargarProductoUnico();
    console.log("Carga de (producto único) completada.");

    // 7. Inicializa el botón "Guardar" (si estamos en 'producto.html')
    inicializarBotonGuardar();
    console.log("Botón 'Guardar' inicializado.");

    // 8. Carga los libros en 'guardado.html' (si estamos en esa página)
    await cargarLibrosGuardados();
    console.log("Página 'Guardados' cargada y renderizada.");

    // <--- AÑADIDO (2/2): Llamamos a la nueva función si estamos en la página correcta
    // 9. Carga los datos de 'mi_cuenta.html' (si estamos en esa página)
    if (document.body.classList.contains('pagina-mi-cuenta')) {
        await cargarDatosMiCuenta();
        console.log("Página 'Mi Cuenta' cargada.");
    }

}); // --- FIN DEL 'DOMContentLoaded' ---


/**
 * Función de ayuda para inicializar todo lo del header en un solo lugar.
 * (Tu código original - ¡Está perfecto!)
 */
function inicializarLogicaHeader() {
    // Lógica de Sesión
    inicializarGestorSesion();
    inicializarLogicaAuth(); // Pone listeners de login y logout

    // Componentes UI del Header
    inicializarModalLogin();
    inicializarBarraBusqueda();
    inicializarBotonGuardados();
    inicializarTogglePasswordLogin(); // El "ojo" del modal
    inicializarDropdownUsuario();
}
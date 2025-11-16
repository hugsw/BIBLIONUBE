// js/services/books.js

import { mostrarAlerta, mostrarConfirmacion } from '../Utils/customalert.js';
// Asegúrate de que no haya un punto extra al inicio ni nada raro.
// Asegúrate de que esta importación exista en tu main.js, o importa aquí:
// import { inicializarModalLogin } from './components/ui.js'; 

/**
 * =======================================================
 * FUNCIÓN "CONSTRUCTORA" DE HTML (MODIFICADA)
 * =======================================================
 */
function renderizarLibros(librosParaRenderizar, contenedor, contexto = 'general') {
    if (!contenedor) return;
    contenedor.innerHTML = '';

    if (librosParaRenderizar.length === 0) {
        contenedor.innerHTML = `<p style="color: #999; text-align: center;">No se encontraron libros para esta categoría.</p>`;
        return;
    }

    librosParaRenderizar.forEach(libro => {
        const placeholderImagen = 'https://dummyimage.com/200x300/555/fff&text=Libro';
        const imagen = libro.imagen || placeholderImagen;
        const alt = libro.alt || libro.titulo;

        let botonHtml = '';
        // ❌ ERROR 1: Eliminado _nbsp_ (se ve como un carácter de espacio HTML)
        if (contexto === 'guardados') {
            botonHtml = `
                <button class="btn-eliminar" data-id="${libro.id}">
                    <i class="fa-solid fa-trash-can"></i> Eliminar
                </button>
            `;
        } else {
            botonHtml = `<a href="/producto?id=${libro.id}" class="btn-ver-mas">Ver Detalles</a>`;
        }

        const htmlDelLibro = `
        <div class="producto">
            <a href="/producto?id=${libro.id}">
                <img src="${imagen}" alt="${alt}">
            </a>
            <div class="producto__informacion">
                <h3 class="producto__nombre">${libro.titulo}</h3>
                ${botonHtml} 
            </div>
        </div> `;
        contenedor.insertAdjacentHTML('beforeend', htmlDelLibro);
    });
}


/**
 * =======================================================
 * CARGAR LIBROS (SLIDERS/CATEGORÍAS)
 * =======================================================
 */
export async function cargarYRenderizarLibros() {
    const contInfantilSlider = document.getElementById('slider-infantil');
    const contJuvenilSlider = document.getElementById('slider-juvenil');
    const contAdultoSlider = document.getElementById('slider-adulto');
    const contCategoria = document.querySelector('.grid-categoria');

    const esIndex = contInfantilSlider && contJuvenilSlider && contAdultoSlider;
    const esCategoria = contCategoria && contCategoria.id !== 'grid-guardados';

    if (!esIndex && !esCategoria) {
        return;
    }

    const API_URL = '/libros';

    console.log("Cargando libros desde la API...");

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const librosDesdeAPI = await response.json();
        if (librosDesdeAPI.error) throw new Error(librosDesdeAPI.error);

        if (esIndex) {
            console.log("Renderizando sliders para index.html");
            const librosInfantiles = librosDesdeAPI.filter(l => l.categoria === 'Sección Infantil');
            const librosJuveniles = librosDesdeAPI.filter(l => l.categoria === 'Sección Juvenil');
            const librosAdultos = librosDesdeAPI.filter(l => l.categoria === 'Sección Adulto');

            renderizarLibros(librosInfantiles, contInfantilSlider);
            renderizarLibros(librosJuveniles, contJuvenilSlider);
            renderizarLibros(librosAdultos, contAdultoSlider);

        } else if (esCategoria) {
            const categoriaActual = contCategoria.dataset.categoria;
            console.log(`Renderizando grid para: ${categoriaActual}`);

            if (categoriaActual) {
                const librosFiltrados = librosDesdeAPI.filter(l => l.categoria === categoriaActual);
                renderizarLibros(librosFiltrados, contCategoria);
            } else {
                console.error("Error: .grid-categoria no tiene 'data-categoria'");
            }
        }
    } catch (error) {
        console.error('Error grave al cargar libros desde la API:', error);
        if (esIndex) {
            document.getElementById('slider-infantil').innerHTML = `<p class="error-api">Error al cargar libros.</p>`;
        } else if (esCategoria) {
            contCategoria.innerHTML = `<p class="error-api">Error al cargar libros.</p>`;
        }
    }
}


/**
 * =======================================================
 * CARGAR PÁGINA DE PRODUCTO ÚNICO
 * =======================================================
 */
export async function cargarProductoUnico() {
    const tituloElement = document.getElementById('libro-titulo');
    if (!tituloElement) return;

    console.log("Cargando datos de producto único...");
    const botonGuardar = document.getElementById('btn-guardar');
    let libroId;

    try {
        const params = new URLSearchParams(window.location.search);
        libroId = params.get('id');
        if (!libroId) throw new Error("No se especificó un ID de libro.");

        const API_URL = `/libros/${libroId}`;
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("No se pudo cargar la información del libro.");

        const data = await response.json();

        // --- MEJORAS DE ROBUSTEZ Y CORRECCIÓN DE CAMPO INICIO ---
        document.getElementById('libro-titulo').textContent = data.titulo || 'Título no disponible';
        document.getElementById('libro-autor').textContent = data.autor || 'Autor Desconocido';
        document.getElementById('libro-descripcion').textContent = data.descripcion || 'Descripción no disponible';

        // CORRECCIÓN CLAVE: Buscamos 'data.publicacion' en lugar de 'data.anio'
        const anioElemento = document.getElementById('libro-anio');
        // El elemento separador (|) se asume que es el hermano anterior
        const separadorElemento = anioElemento ? anioElemento.previousElementSibling : null;

        if (data.publicacion) {
            anioElemento.textContent = data.publicacion;
            anioElemento.style.display = 'inline'; // Aseguramos que se muestre
            if (separadorElemento && separadorElemento.textContent.includes('|')) {
                separadorElemento.style.display = 'inline'; // Aseguramos que se muestre
            }
        } else {
            // Si falta el dato de publicación, ocultamos ambos elementos para no romper el diseño
            anioElemento.style.display = 'none';
            if (separadorElemento && separadorElemento.textContent.includes('|')) {
                separadorElemento.style.display = 'none';
            }
        }
        // --- MEJORAS DE ROBUSTEZ Y CORRECCIÓN DE CAMPO FIN ---


        const imgElement = document.getElementById('libro-imagen');
        // Damos prioridad a la url_portada. Si no existe, usamos la 'imagen', y si no, el placeholder.
        imgElement.src = data.url_portada || data.imagen || 'https://placehold.co/400x600/6c757d/white?text=Libro';
        imgElement.alt = data.titulo;

        botonGuardar.dataset.id = libroId;
        botonGuardar.dataset.titulo = data.titulo;
        botonGuardar.dataset.imagen = data.imagen || 'https://placehold.co/400x600/6c757d/white?text=Libro';

        const botonDescargar = document.getElementById('boton-descargar-libro');
        if (botonDescargar && data.url) {
            botonDescargar.href = data.url;
        } else if (botonDescargar) {
            botonDescargar.href = '#';
            botonDescargar.style.display = 'none';
        }

        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const guardadosResponse = await fetch('/mis-libros-guardados', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (guardadosResponse.ok) {
                    const librosGuardados = await guardadosResponse.json();
                    const yaEstaGuardado = librosGuardados.find(libro => libro.id == libroId);

                    if (yaEstaGuardado) {
                        botonGuardar.textContent = 'Guardado ✔';
                        // ❌ ERROR 2: Eliminado _nbsp_ (carácter de espacio HTML)
                        botonGuardar.disabled = true;
                        botonGuardar.classList.add('guardado');
                    }
                }
            } catch (err) {
                console.warn("No se pudo verificar el estado de 'guardado' del libro.", err);
            }
        }

    } catch (error) {
        console.error("Error al cargar el producto:", error);
        tituloElement.textContent = "Error al cargar el libro";
        const detalles = document.querySelector('.producto-detalles');
        if (detalles) {
            detalles.innerHTML = `<h1 style="color: red;">Error</h1><p>${error.message}</p><a href="/">Volver</a>`;
        }
    }
}


/**
 * =======================================================
 * BOTÓN "GUARDAR" (PÁGINA DE PRODUCTO) - (MODIFICADO)
 * =======================================================
 */
export function inicializarBotonGuardar() {
    const botonGuardar = document.getElementById('btn-guardar');
    // Buscamos el modal de login, ya que si no hay token, lo abriremos.
    const modalLogin = document.getElementById('modalLogin');

    if (!botonGuardar) return;

    botonGuardar.addEventListener('click', async () => {

        const libro = {
            id: botonGuardar.dataset.id,
            titulo: botonGuardar.dataset.titulo,
            imagen: botonGuardar.dataset.imagen
        };

        if (!libro.id) {
            // Manejo de error de datos
            try {
                await mostrarAlerta("Error: No se pudo obtener la información del libro. Intente recargar la página.");
            } catch (e) {
                console.error(e);
                alert("Error: No se pudo obtener la información del libro. Intente recargar la página.");
            }
            return;
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
            // Si no hay token, abrimos el modal de login directamente (mejor UX)
            if (modalLogin) {
                modalLogin.classList.add('visible');
                document.body.classList.add('modal-open');
            } else {
                try {
                    await mostrarAlerta("Necesitas iniciar sesión para guardar libros.");
                } catch (e) {
                    console.error(e);
                    alert("Necesitas iniciar sesión para guardar libros.");
                }
            }
            return; // Detiene la ejecución.
        }

        try {
            if (botonGuardar.disabled) return;

            botonGuardar.disabled = true;
            botonGuardar.textContent = 'Guardando...';

            const datos = { libro_id: parseInt(libro.id) };
            const response = await fetch('/guardar-libro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // ❌ ERROR 3: Eliminado punto extra al final de 'Authorization'
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datos)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "No se pudo guardar el libro.");

            botonGuardar.textContent = 'Guardado ✔';
            botonGuardar.classList.add('guardado');
        } catch (error) {
            console.error("Error al guardar:", error);
            await mostrarAlerta(error.message);

            if (error.message.includes("ya está en tu lista")) {
                // ❌ ERROR 4: Eliminado _nbsp_ (carácter de espacio HTML)
                botonGuardar.textContent = 'Guardado ✔';
                botonGuardar.classList.add('guardado');
            } else {
                botonGuardar.disabled = false;
                botonGuardar.textContent = 'Guardar';
            }
        }
    });
}


/**
 * =======================================================
 * CARGAR PÁGINA "GUARDADOS"
 * =======================================================
 */
export async function cargarLibrosGuardados() {
    const contGuardados = document.getElementById('grid-guardados');
    if (!contGuardados) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
        // ❌ ERROR 5: Eliminado punto y coma extra '; t' que causa un error de sintaxis.
        contGuardados.innerHTML = `<p style="color: #999;">Debes <a href="#" id="login-link-guardados">iniciar sesión</a> para ver tus libros guardados.</p>`;
        return;
    }

    try {
        const response = await fetch('/mis-libros-guardados', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Error al cargar tus libros.");
        }

        const libros = await response.json();

        if (libros.length === 0) {
            contGuardados.innerHTML = `<p style="color: #999; text-align: center;">No tienes ningún libro guardado todavía.</p>`;
            return;
        }

        renderizarLibros(libros, contGuardados, 'guardados');

        // --- CORRECCIÓN: Llamamos a la nueva función de delegación
        inicializarDelegacionEliminar(contGuardados);

    } catch (error) {
        console.error("Error cargando libros guardados:", error);
        contGuardados.innerHTML = `<p class="error-api">${error.message}</p>`;
    }
}


/**
 * =======================================================
 * FUNCIÓN DELEGADA: INICIALIZAR LISTENERS DE ELIMINAR
 * =======================================================
 */
// Se elimina la función addDeleteButtonListeners() anterior.
// Se reemplaza por esta función de delegación de eventos.
export function inicializarDelegacionEliminar(contenedor) {
    if (!contenedor) return;

    // Colocamos un ÚNICO listener en el contenedor padre estático
    contenedor.addEventListener('click', (e) => {
        // Usamos .closest() para verificar si el click fue en un botón de eliminar o su icono
        const botonEliminar = e.target.closest('.btn-eliminar');

        if (botonEliminar) {
            const libroId = botonEliminar.dataset.id;
            const tarjetaLibro = botonEliminar.closest('.producto');

            // Verificación: si esto se ejecuta, el listener delegado funciona.
            console.log(`[Delegación OK] Click en Eliminar para ID: ${libroId}`);

            handleEliminarLibro(libroId, tarjetaLibro);
        }
    });
}


// =======================================================
// LÓGICA "ELIMINAR" LIBRO (CORREGIDA CON MODALES PERSONALIZADOS)
// =======================================================
async function handleEliminarLibro(libroId, tarjetaElemento) {

    // --- PASO 1: CONFIRMACIÓN PERSONALIZADA ---
    // [CORRECCIÓN 1]: Usamos tu nueva función 'mostrarConfirmacion'
    // que viene de customAlert.js
    const confirmado = await mostrarConfirmacion('¿Estás seguro de que quieres eliminar este libro de tus guardados?');

    if (!confirmado) {
        // El usuario hizo clic en "Cancelar"
        return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        // [CORRECCIÓN 2]: Usamos tu nueva función 'mostrarAlerta'
        await mostrarAlerta("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        return;
    }

    try {
        // --- PASO 2: LLAMADA A LA API (Esto ya estaba bien) ---
        const datos = { libro_id: parseInt(libroId) };
        const response = await fetch('/quitar-libro', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datos)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "No se pudo eliminar el libro.");
        }

        // --- PASO 3: ELIMINACIÓN VISUAL (Esto ya estaba bien) ---
        if (tarjetaElemento) {
            tarjetaElemento.style.transition = 'opacity 0.3s ease-out';
            tarjetaElemento.style.opacity = '0';

            setTimeout(() => {
                tarjetaElemento.remove();

                const contenedor = document.getElementById('grid-guardados');
                if (contenedor && contenedor.children.length === 0) {
                    contenedor.innerHTML = `<p style="color: #999; text-align: center;">No tienes ningún libro guardado todavía.</p>`;
                }
            }, 300);
        }

    } catch (error) {
        // [CORRECCIÓN 3]: Usamos tu nueva función 'mostrarAlerta'
        console.error("Error al eliminar:", error);
        await mostrarAlerta("Error: " + error.message);
    }
}
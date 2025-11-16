import { mostrarAlerta, mostrarConfirmacion } from '../Utils/customalert.js';
// 'firebase' es un objeto global que se carga desde los scripts
// en tu HTML (como firebase-app-compat.js), por eso podemos usarlo aquí.

// =======================================================
// ¡NUEVA FUNCIÓN DE AYUDA!
// =Men- (Reemplaza a localStorage.getItem('authToken'))
// =======================================================
/**
 * Obtiene el token de autenticación de Firebase del usuario actual.
 * Refresca el token si es necesario.
 * @returns {Promise<string|null>} El token de ID de Firebase o null si no hay sesión.
 */
async function getFirebaseToken() {
    const user = firebase.auth().currentUser;
    if (user) {
        try {
            // Obtiene el token de ID (lo refresca si está expirado)
            return await user.getIdToken(true);
        } catch (error) {
            console.error("Error al obtener el token de Firebase:", error);
            return null;
        }
    }
    return null; // No hay usuario logueado
}


/**
 * =======================================================
 * FUNCIÓN "CONSTRUCTORA" DE HTML (Sin cambios)
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
 * CARGAR LIBROS (SLIDERS/CATEGORÍAS) (Sin cambios)
 * =======================================================
 */
export async function cargarYRenderizarLibros() {
    // ... (Tu código para cargar libros públicos está perfecto, no necesita token)
    // ... (Lo copio tal cual)
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
        // ... (resto de tu manejo de errores)
    }
}


/**
 * =======================================================
 * CARGAR PÁGINA DE PRODUCTO ÚNICO (¡CORREGIDO!)
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

        // ... (Toda tu lógica para rellenar el HTML es perfecta)
        document.getElementById('libro-titulo').textContent = data.titulo || 'Título no disponible';
        document.getElementById('libro-autor').textContent = data.autor || 'Autor Desconocido';
        document.getElementById('libro-descripcion').textContent = data.descripcion || 'Descripción no disponible';
        
        // ... (Tu lógica del año y separador)
        const anioElemento = document.getElementById('libro-anio');
        const separadorElemento = anioElemento ? anioElemento.previousElementSibling : null;
        if (data.publicacion) {
            anioElemento.textContent = data.publicacion;
            anioElemento.style.display = 'inline';
            if (separadorElemento) separadorElemento.style.display = 'inline';
        } else {
            anioElemento.style.display = 'none';
            if (separadorElemento) separadorElemento.style.display = 'none';
        }
        
        // ... (Tu lógica de imagen y botones)
        const imgElement = document.getElementById('libro-imagen');
        imgElement.src = data.url_portada || data.imagen || 'https://placehold.co/400x600/6c757d/white?text=Libro';
        imgElement.alt = data.titulo;
        botonGuardar.dataset.id = libroId;
        botonGuardar.dataset.titulo = data.titulo;
        botonGuardar.dataset.imagen = data.imagen || 'https://placehold.co/400x600/6c757d/white?text=Libro';
        const botonDescargar = document.getElementById('boton-descargar-libro');
        if (botonDescargar && data.url) {
            botonDescargar.href = data.url;
        } else if (botonDescargar) {
            botonDescargar.style.display = 'none';
        }

        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        // 1. Reemplazamos localStorage.getItem('authToken')
        const token = await getFirebaseToken(); 

        if (token) {
            // 2. El resto de tu lógica es la misma
            try {
                const guardadosResponse = await fetch('/mis-libros-guardados', {
                    headers: { 'Authorization': `Bearer ${token}` } // <--- Usa el token de Firebase
                });

                if (guardadosResponse.ok) {
                    const librosGuardados = await guardadosResponse.json();
                    const yaEstaGuardado = librosGuardados.find(libro => libro.id == libroId);

                    if (yaEstaGuardado) {
                        botonGuardar.textContent = 'Guardado ✔';
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
        // ... (Tu manejo de errores)
    }
}


/**
 * =======================================================
 * BOTÓN "GUARDAR" (PÁGINA DE PRODUCTO) - (¡CORREGIDO!)
 * =======================================================
 */
export function inicializarBotonGuardar() {
    const botonGuardar = document.getElementById('btn-guardar');
    const modalLogin = document.getElementById('modalLogin');
    if (!botonGuardar) return;

    botonGuardar.addEventListener('click', async () => {

        const libro = {
            id: botonGuardar.dataset.id,
            titulo: botonGuardar.dataset.titulo,
            imagen: botonGuardar.dataset.imagen
        };

        if (!libro.id) {
            await mostrarAlerta("Error: No se pudo obtener la información del libro. Intente recargar la página.");
            return;
        }

        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        // 1. Reemplazamos localStorage.getItem('authToken')
        const token = await getFirebaseToken(); 

        if (!token) {
            // 2. Tu lógica para abrir el modal es perfecta
            if (modalLogin) {
                modalLogin.classList.add('visible');
                document.body.classList.add('modal-open');
            } else {
                await mostrarAlerta("Necesitas iniciar sesión para guardar libros.");
            }
            return; 
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
                    'Authorization': `Bearer ${token}` // <--- Usa el token de Firebase
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
 * CARGAR PÁGINA "GUARDADOS" (¡CORREGIDO!)
 * =======================================================
 */
export async function cargarLibrosGuardados() {
    const contGuardados = document.getElementById('grid-guardados');
    if (!contGuardados) return;

    // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
    // 1. Reemplazamos localStorage.getItem('authToken')
    const token = await getFirebaseToken(); 

    if (!token) {
        // 2. Tu lógica de "iniciar sesión" es perfecta
        contGuardados.innerHTML = `<p style="color: #999;">Debes <a href="#" id="login-link-guardados">iniciar sesión</a> para ver tus libros guardados.</p>`;
        
        // (Añadimos un listener a ese link por si acaso)
        const loginLink = document.getElementById('login-link-guardados');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                const modalLogin = document.getElementById('modalLogin');
                if (modalLogin) {
                    modalLogin.classList.add('visible');
                    document.body.classList.add('modal-open');
                }
            });
        }
        return;
    }

    try {
        const response = await fetch('/mis-libros-guardados', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` } // <--- Usa el token de Firebase
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

        // Tu lógica de delegación de "eliminar" es perfecta
        inicializarDelegacionEliminar(contGuardados);

    } catch (error) {
        console.error("Error cargando libros guardados:", error);
        contGuardados.innerHTML = `<p class="error-api">${error.message}</p>`;
    }
}


/**
 * =======================================================
 * FUNCIÓN DELEGADA: INICIALIZAR LISTENERS DE ELIMINAR (Sin cambios)
 * =======================================================
 */
export function inicializarDelegacionEliminar(contenedor) {
    if (!contenedor) return;

    contenedor.addEventListener('click', (e) => {
        const botonEliminar = e.target.closest('.btn-eliminar');

        if (botonEliminar) {
            const libroId = botonEliminar.dataset.id;
            const tarjetaLibro = botonEliminar.closest('.producto');
            console.log(`[Delegación OK] Click en Eliminar para ID: ${libroId}`);
            
            // Llamamos a la función helper (¡que también debemos corregir!)
            handleEliminarLibro(libroId, tarjetaLibro);
        }
    });
}


/**
 * =======================================================
 * LÓGICA "ELIMINAR" LIBRO (¡CORREGIDO!)
 * =======================================================
 */
async function handleEliminarLibro(libroId, tarjetaElemento) {

    const confirmado = await mostrarConfirmacion('¿Estás seguro de que quieres eliminar este libro de tus guardados?');
    if (!confirmado) {
        return;
    }

    // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
    // 1. Reemplazamos localStorage.getItem('authToken')
    const token = await getFirebaseToken(); 

    if (!token) {
        await mostrarAlerta("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        return;
    }

    try {
        const datos = { libro_id: parseInt(libroId) };
        const response = await fetch('/quitar-libro', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // <--- Usa el token de Firebase
            },
            body: JSON.stringify(datos)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "No se pudo eliminar el libro.");
        }

        // Tu lógica para eliminar la tarjeta del DOM es perfecta
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
        console.error("Error al eliminar:", error);
        await mostrarAlerta("Error: " + error.message);
    }
}
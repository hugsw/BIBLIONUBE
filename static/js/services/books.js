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
// Asegúrate de que 'mostrarAlerta' esté disponible (ya sea global o importada)
// import { mostrarAlerta } from '../Utils/customalert.js'; // Descomenta si usas módulos estrictos

export function inicializarBotonGuardar() {
    const botonGuardar = document.getElementById('btn-guardar');
    const modalLogin = document.getElementById('modalLogin');

    // Si no existe el botón (ej. no estamos en la página de producto), no hacemos nada.
    if (!botonGuardar) return;

    botonGuardar.addEventListener('click', async () => {

        // 1. Obtener datos del dataset del HTML
        // Asegúrate de que tu HTML sea: <button id="btn-guardar" data-id="5" ...>
        const libro = {
            id: botonGuardar.dataset.id,
            titulo: botonGuardar.dataset.titulo, // Opcional, si lo necesitas
            imagen: botonGuardar.dataset.imagen  // Opcional, si lo necesitas
        };

        if (!libro.id) {
            // Usamos console.error para depurar si falta el ID
            console.error("Error: El botón no tiene data-id");
            if (typeof mostrarAlerta === 'function') {
                await mostrarAlerta("Error", "No se pudo identificar el libro. Recarga la página.");
            } else {
                alert("Error: No se pudo identificar el libro.");
            }
            return;
        }

        // --- CORRECCIÓN: Obtener el usuario y token de Firebase ---
        const user = firebase.auth().currentUser;

        if (!user) {
            // --- CASO: NO LOGUEADO ---
            // Guardamos la intención en sessionStorage por si acaso (opcional)
            sessionStorage.setItem('redirectAfterLogin', window.location.href);

            if (modalLogin) {
                modalLogin.classList.add('visible');
                document.body.classList.add('modal-open');
            } else {
                alert("Inicia sesión para guardar este libro.");
            }
            return;
        }

        // Si hay usuario, obtenemos el token real
        const token = await user.getIdToken();

        // ----------------------------------------------------------

        try {
            // Evitar doble clic
            if (botonGuardar.disabled) return;

            // Estado de "Cargando"
            const textoOriginal = botonGuardar.innerHTML; // Guardamos el icono/texto original
            botonGuardar.disabled = true;
            botonGuardar.textContent = 'Guardando...';

            const datos = { libro_id: parseInt(libro.id) };

            // VERIFICA TU RUTA AQUÍ: ¿Es '/guardar-libro' o '/api/guardar-libro'?
            const response = await fetch('/guardar-libro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datos)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "No se pudo guardar el libro.");
            }

            // ÉXITO
            botonGuardar.innerHTML = '<i class="fa-solid fa-check"></i> Guardado';
            botonGuardar.classList.add('guardado'); // Añade clase para cambiar color (ej. verde)

        } catch (error) {
            console.error("Error al guardar:", error);

            // Restaurar botón si falla (excepto si ya estaba guardado)
            if (error.message.includes("ya está en tu lista") || error.message.includes("Duplicate")) {
                botonGuardar.innerHTML = '<i class="fa-solid fa-check"></i> Guardado';
                botonGuardar.classList.add('guardado');
            } else {
                botonGuardar.disabled = false;
                botonGuardar.innerHTML = '<i class="fa-solid fa-bookmark"></i> Guardar'; // Restaura texto original

                if (typeof mostrarAlerta === 'function') {
                    await mostrarAlerta("Error", error.message);
                } else {
                    alert(error.message);
                }
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
            // --- ¡CORRECCIÓN 1! ---
            // Si el botón ya está deshabilitado, ignora este clic.
            if (botonEliminar.disabled) return;

            const libroId = botonEliminar.dataset.id;
            const tarjetaLibro = botonEliminar.closest('.producto');
            console.log(`[Delegación OK] Click en Eliminar para ID: ${libroId}`);

            // --- ¡CORRECCIÓN 2! ---
            // Pasa 'botonEliminar' como tercer argumento.
            handleEliminarLibro(libroId, tarjetaLibro, botonEliminar);
        }
    });
}


/**
 * =======================================================
 * LÓGICA "ELIMINAR" LIBRO (¡CORREGIDO DEFINITIVAMENTE!)
 * =======================================================
 */
async function handleEliminarLibro(libroId, tarjetaElemento, botonElemento) {

    // --- ¡LA CORRECCIÓN DEFINITIVA! ---
    // 1. Deshabilita el botón INMEDIATAMENTE al hacer clic,
    // ANTES de mostrar la confirmación (await).
    if (botonElemento) {
        botonElemento.disabled = true;
        botonElemento.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    }

    // 2. Muestra la confirmación
    const confirmado = await mostrarConfirmacion('¿Estás seguro de que quieres eliminar este libro de tus guardados?');

    if (!confirmado) {
        // 3. Si el usuario cancela, VUELVE A HABILITAR el botón
        if (botonElemento) {
            botonElemento.disabled = false;
            botonElemento.innerHTML = '<i class="fa-solid fa-trash-can"></i> Eliminar';
        }
        return; // El usuario canceló
    }

    // 4. Si el usuario aceptó, el botón ya está deshabilitado y procedemos...
    const token = await getFirebaseToken();

    if (!token) {
        await mostrarAlerta("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        // 5. Si falla el token, vuelve a habilitar el botón
        if (botonElemento) {
            botonElemento.disabled = false;
            botonElemento.innerHTML = '<i class="fa-solid fa-trash-can"></i> Eliminar';
        }
        return;
    }

    try {
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
            // Aquí es donde se lanza tu error
            throw new Error(data.error || "No se pudo eliminar el libro.");
        }

        // ÉXITO: Tu lógica para eliminar la tarjeta del DOM es perfecta
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

        // 6. Si la API falla, vuelve a habilitar el botón
        if (botonElemento) {
            botonElemento.disabled = false;
            botonElemento.innerHTML = '<i class="fa-solid fa-trash-can"></i> Eliminar';
        }
    }
}
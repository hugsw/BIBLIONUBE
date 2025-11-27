import { mostrarAlerta, mostrarConfirmacion } from '../Utils/customalert.js';
import { inicializarSliders } from '../components/ui.js'; 
import { auth } from '../config/firebase-config.js';

async function getFirebaseToken() {
    const user = auth.currentUser;
    if (user) {
        try {
            return await user.getIdToken(true);
        } catch (error) {
            console.error("Error al obtener el token de Firebase:", error);
            return null;
        }
    }
    return null;
}

function renderizarLibros(librosParaRenderizar, contenedor, contexto = 'general') {
    if (!contenedor) return;
    contenedor.innerHTML = '';

    if (librosParaRenderizar.length === 0) {
        contenedor.innerHTML = `<p style="color: #999; text-align: center;">No se encontraron libros para esta categoría.</p>`;
        return;
    }

    librosParaRenderizar.forEach(libro => {
        const placeholderImagen = '/static/img/PORTADA.jpg';
        const imagen = libro.imagen || placeholderImagen;
        const alt = libro.alt || libro.titulo;

        let botonHtml = '';
        if (contexto === 'guardados') {
            botonHtml = `
                <button class="btn-eliminar" data-id="${libro.id}">
                    <i class="fa-solid fa-trash-can"></i> Eliminar
                </button>
            `;
        }

        const htmlDelLibro = `
        <div class="producto">
            <a href="/producto?id=${libro.id}">
                <img src="${imagen}" alt="${alt}" loading="lazy" width="200" height="300">
            </a>
            <div class="producto__informacion">
                <h3 class="producto__nombre">${libro.titulo}</h3>
                ${botonHtml} 
            </div>
        </div> `;
        contenedor.insertAdjacentHTML('beforeend', htmlDelLibro);
    });
}

export async function cargarYRenderizarLibros() {
    const contInfantilSlider = document.getElementById('slider-infantil');
    const contJuvenilSlider = document.getElementById('slider-juvenil');
    const contAdultoSlider = document.getElementById('slider-adulto');
    const contCategoria = document.querySelector('.grid-categoria');

    const esIndex = contInfantilSlider && contJuvenilSlider && contAdultoSlider;
    const esCategoria = contCategoria && contCategoria.id !== 'grid-guardados' && contCategoria.id !== 'grid-resultados';

    if (!esIndex && !esCategoria) {
        return;
    }

    const API_URL = '/libros';

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const librosDesdeAPI = await response.json();
        if (librosDesdeAPI.error) throw new Error(librosDesdeAPI.error);

        if (esIndex) {
            const librosInfantiles = librosDesdeAPI.filter(l => l.categoria === 'Sección Infantil');
            const librosJuveniles = librosDesdeAPI.filter(l => l.categoria === 'Sección Juvenil');
            const librosAdultos = librosDesdeAPI.filter(l => l.categoria === 'Sección Adulto');

            renderizarLibros(librosInfantiles, contInfantilSlider);
            renderizarLibros(librosJuveniles, contJuvenilSlider);
            renderizarLibros(librosAdultos, contAdultoSlider);

        } else if (esCategoria) {
            const categoriaActual = contCategoria.dataset.categoria;

            if (categoriaActual) {
                const librosFiltrados = librosDesdeAPI.filter(l => l.categoria === categoriaActual);
                renderizarLibros(librosFiltrados, contCategoria);
            } else {
                console.error("Error: .grid-categoria no tiene 'data-categoria'");
            }
        }
    } catch (error) {
        console.error('Error grave al cargar libros desde la API:', error);
    }
}

export async function cargarProductoUnico() {
    const tituloElement = document.getElementById('libro-titulo');
    if (!tituloElement) return;

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

        document.getElementById('libro-titulo').textContent = data.titulo || 'Título no disponible';
        document.getElementById('libro-autor').textContent = data.autor || 'Autor Desconocido';
        document.getElementById('libro-descripcion').textContent = data.descripcion || 'Descripción no disponible';

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

        if (data.id_categoria) {
            await cargarRecomendados(data.id_categoria, libroId);
        }

        const token = await getFirebaseToken();

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
                        botonGuardar.disabled = true;
                        botonGuardar.classList.add('guardado');
                    }
                }
            } catch (err) {
                console.error("Error al verificar si el libro está guardado:", err);
            }
        }

    } catch (error) {
        console.error("Error al cargar el producto:", error);
    }
}

async function cargarRecomendados(idCategoria, idLibroActual) {
    const contenedor = document.getElementById('grid-recomendados');
    const seccion = document.getElementById('seccion-recomendados');
    
    if (!contenedor || !seccion) return;

    try {
        const response = await fetch(`/libros/recomendados-ml/${idLibroActual}`);
        
        if (!response.ok) throw new Error("Error al obtener recomendaciones");

        const libros = await response.json();

        if (libros && libros.length > 0) {
    
            contenedor.innerHTML = '';
            
            libros.forEach(libro => {
                const placeholderImagen = '/static/img/PORTADA.jpg';
                const imagen = libro.imagen || placeholderImagen;
                
                const htmlDelLibro = `
                <div class="producto">
                    <a href="/producto?id=${libro.id}">
                        <img src="${imagen}" alt="${libro.titulo}" loading="lazy" width="140" height="210">
                    </a>
                    <div class="producto__informacion">
                        <h3 class="producto__nombre">${libro.titulo}</h3>
                    </div>
                </div> `;
                contenedor.insertAdjacentHTML('beforeend', htmlDelLibro);
            });

            seccion.style.display = 'block';
        } else {
            seccion.style.display = 'none';
        }
    } catch (error) {
        console.error("Error cargando recomendaciones ML:", error);
    }
}

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
            console.error("Error: El botón no tiene data-id");
            if (typeof mostrarAlerta === 'function') {
                await mostrarAlerta("Error", "No se pudo identificar el libro. Recarga la página.");
            } else {
                alert("Error: No se pudo identificar el libro.");
            }
            return;
        }

        const user = auth.currentUser;

        if (!user) {
            sessionStorage.setItem('redirectAfterLogin', window.location.href);

            if (modalLogin) {
                modalLogin.classList.add('visible');
                document.body.classList.add('modal-open');
            } else {
                alert("Inicia sesión para guardar este libro.");
            }
            return;
        }

        const token = await user.getIdToken();

        try {
            if (botonGuardar.disabled) return;
            const textoOriginal = botonGuardar.innerHTML;
            botonGuardar.disabled = true;
            botonGuardar.textContent = 'Guardando...';

            const datos = { libro_id: parseInt(libro.id) };

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

            botonGuardar.innerHTML = '<i class="fa-solid fa-check"></i> Guardado';
            botonGuardar.classList.add('guardado');

        } catch (error) {
            console.error("Error al guardar:", error);
            if (error.message.includes("ya está en tu lista") || error.message.includes("Duplicate")) {
                botonGuardar.innerHTML = '<i class="fa-solid fa-check"></i> Guardado';
                botonGuardar.classList.add('guardado');
            } else {
                botonGuardar.disabled = false;
                botonGuardar.innerHTML = '<i class="fa-solid fa-bookmark"></i> Guardar';

                if (typeof mostrarAlerta === 'function') {
                    await mostrarAlerta("Error", error.message);
                } else {
                    alert(error.message);
                }
            }
        }
    });
}

export async function cargarLibrosGuardados() {
    const contGuardados = document.getElementById('grid-guardados');
    if (!contGuardados) return;

    const token = await getFirebaseToken();

    if (!token) {
        contGuardados.innerHTML = `<p style="color: #999;">Debes <a href="#" id="login-link-guardados">iniciar sesión</a> para ver tus libros guardados.</p>`;

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

        inicializarDelegacionEliminar(contGuardados);

        if (typeof cargarRecomendacionesHibridas === 'function') {
            await cargarRecomendacionesHibridas(); 
        }

    } catch (error) {
        console.error("Error cargando libros guardados:", error);
        contGuardados.innerHTML = `<p class="error-api">${error.message}</p>`;
    }
}

export function inicializarDelegacionEliminar(contenedor) {
    if (!contenedor) return;

    contenedor.addEventListener('click', (e) => {
        const botonEliminar = e.target.closest('.btn-eliminar');

        if (botonEliminar) {

            if (botonEliminar.disabled) return;

            const libroId = botonEliminar.dataset.id;
            const tarjetaLibro = botonEliminar.closest('.producto');
            handleEliminarLibro(libroId, tarjetaLibro, botonEliminar);
        }
    });
}

async function handleEliminarLibro(libroId, tarjetaElemento, botonElemento) {

    if (botonElemento) {
        botonElemento.disabled = true;
        botonElemento.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    }

    const confirmado = await mostrarConfirmacion('¿Estás seguro de que quieres eliminar este libro de tus guardados?');

    if (!confirmado) {
        if (botonElemento) {
            botonElemento.disabled = false;
            botonElemento.innerHTML = '<i class="fa-solid fa-trash-can"></i> Eliminar';
        }
        return;
    }

    const token = await getFirebaseToken();

    if (!token) {
        await mostrarAlerta("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
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
            throw new Error(data.error || "No se pudo eliminar el libro.");
        }

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

        if (botonElemento) {
            botonElemento.disabled = false;
            botonElemento.innerHTML = '<i class="fa-solid fa-trash-can"></i> Eliminar';
        }
    }
}

export async function cargarResultadosBusqueda() {
    const grid = document.getElementById('grid-resultados');
    const titulo = document.getElementById('titulo-busqueda');

    if (!grid || !titulo) return;

    const params = new URLSearchParams(window.location.search);
    const query = params.get('query');

    if (!query) {
        titulo.textContent = "Búsqueda vacía";
        grid.innerHTML = "<p>Escribe algo en el buscador.</p>";
        return;
    }

    titulo.textContent = `Resultados para: "${query}"`;

    try {
        
        const response = await fetch(`/api/buscar?query=${encodeURIComponent(query)}`);
        const libros = await response.json();

        if (libros.length > 0) {
            renderizarLibros(libros, grid, 'general');
        } else {
            grid.innerHTML = `<p style="text-align:center;">No encontramos libros con ese nombre.</p>`;
        }

    } catch (error) {
        console.error(error);
        grid.innerHTML = `<p>Hubo un error al buscar.</p>`;
    }
}

async function cargarRecomendacionesHibridas() {
    const contenedor = document.getElementById('grid-recomendados');
    const seccion = document.getElementById('seccion-recomendados-guardados');
    const token = await getFirebaseToken();

    if (!contenedor || !seccion || !token) return;

    try {
        const response = await fetch('/libros/recomendados/mis-guardados', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const libros = await response.json();

        if (libros && libros.length > 0) {
            contenedor.innerHTML = '';

            libros.forEach(libro => {
                const placeholderImagen = '/static/img/PORTADA.jpg';
                const imagen = libro.imagen || placeholderImagen;

                const htmlDelLibro = `
                <div class="producto">
                    <a href="/producto?id=${libro.id}">
                        <img src="${imagen}" alt="${libro.titulo}" loading="lazy" width="140" height="210">
                    </a>
                    <div class="producto__informacion">
                        <h3 class="producto__nombre">${libro.titulo}</h3>
                    </div>
                </div> `;
                contenedor.insertAdjacentHTML('beforeend', htmlDelLibro);
            });

            seccion.style.display = 'block';
        }
    } catch (error) {
        console.error("Error cargando recomendaciones híbridas:", error);
    }
}
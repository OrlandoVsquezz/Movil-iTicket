import { obtenerProyectos } from "../services/proyectoService.js";

const contenedorProyectos = document.getElementById('contenedorProyectos');
const paginacionProyectos = document.getElementById('paginacionProyectos');
const infoProyectos = document.getElementById('infoProyectos');
const filtrosWrapper = document.querySelectorAll('.filter-wrapper');
const txtBuscar = document.getElementById('txtBuscar');
const btnFecha = document.getElementById('btnFecha');
const inputFecha = document.getElementById('inputFecha');
const btnActualizarProyecto = document.getElementById('btnActualizarProyecto');

const TAMANO_PAGINA_PROYECTOS = 5;
let paginaActualProyectos = 1;
let proyectos = [];
let filtrosActuales = {};
let temporizadorBusqueda = null;

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.filter-button[data-filtro] .filter-text').forEach((texto) => {
        texto.dataset.textoDefault = texto.textContent;
    });
    cargarProyectos();
});

document.addEventListener('click', () => cerrarPaneles());

function normalizarTipoProyecto(tipo) {
    if (tipo === null || tipo === undefined) return '';

    return String(tipo)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function obtenerTipoProyectoVisible(tipo) {
    const normalizado = normalizarTipoProyecto(tipo);

    const equivalencias = {
        construccion: 'Construccion',
        remodelacion: 'Remodelacion',
        ampliacion: 'Ampliacion',
        mantenimiento: 'Mantenimiento'
    };

    return equivalencias[normalizado] || String(tipo || '').trim() || 'Sin tipo';
}

/* Filtra y pagina en el cliente porque el servicio de proyectos no expone filtros combinados. */
async function cargarProyectos(pagina = 1, recargar = false) {
    if (!contenedorProyectos) return;

    try {
        if (recargar || !proyectos.length) {
            const resultado = await obtenerProyectos();
            proyectos = Array.isArray(resultado) ? resultado : [];
        }

        const proyectosFiltrados = filtrarProyectos(proyectos);
        const totalPaginas = Math.ceil(proyectosFiltrados.length / TAMANO_PAGINA_PROYECTOS);
        paginaActualProyectos = totalPaginas ? Math.min(pagina, totalPaginas) : 1;
        const inicio = (paginaActualProyectos - 1) * TAMANO_PAGINA_PROYECTOS;
        const lista = proyectosFiltrados.slice(inicio, inicio + TAMANO_PAGINA_PROYECTOS);

        renderizarProyectos(lista);
        renderizarPaginacion(totalPaginas, paginaActualProyectos);

        if (infoProyectos) {
            infoProyectos.textContent = lista.length ? `${lista.length}/${proyectosFiltrados.length}` : '';
        }
    } catch (error) {
        contenedorProyectos.innerHTML = `<p class="text-danger text-center w-100 my-4">No se pudieron cargar los proyectos</p>`;
        if (paginacionProyectos) paginacionProyectos.innerHTML = '';
        if (infoProyectos) infoProyectos.textContent = '';
        mostrarError(error?.message || 'Error desconocido al cargar proyectos');
    }
}

function filtrarProyectos(lista) {
    const busqueda = normalizarTexto(filtrosActuales.busqueda);
    const tipo = normalizarTipoProyecto(filtrosActuales.tipo);
    const estado = filtrosActuales.estado;
    const fecha = filtrosActuales.fecha;

    return lista.filter((proyecto) => {
        const textoProyecto = [
            proyecto.nombreProyecto,
            proyecto.codigo,
            proyecto.ubicacion,
            proyecto.nombreCoordinador,
            proyecto.nombreSupervisor,
            proyecto.descripcionProyecto
        ].map(normalizarTexto).join(' ');

        const coincideBusqueda = !busqueda || textoProyecto.includes(busqueda);
        const coincideTipo = !tipo || normalizarTipoProyecto(proyecto.tipoProyecto) === tipo;
        const coincideEstado = estado === undefined || estado === '' || String(Boolean(proyecto.finalizado)) === estado;
        const coincideFecha = !fecha || String(proyecto.fechaInicioEstimada || '').slice(0, 10) === fecha;

        return coincideBusqueda && coincideTipo && coincideEstado && coincideFecha;
    });
}

function normalizarTexto(valor) {
    return String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

//Arma la lista de páginas a mostrar: siempre primera y última, un rango alrededor de la actual, y "..." donde haya un salto entre esos números
//(idéntico al de misTickets.js)
function construirRangoPaginas(totalPaginas, paginaActual, vecinos = 1) {
    const paginas = new Set([1, totalPaginas]);

    for (let i = paginaActual - vecinos; i <= paginaActual + vecinos; i++) {
        if (i >= 1 && i <= totalPaginas) paginas.add(i);
    }

    const ordenadas = [...paginas].sort((a, b) => a - b);

    const rango = [];
    let anterior = null;
    for (const pagina of ordenadas) {
        if (anterior !== null && pagina - anterior > 1) {
            rango.push('...');
        }
        rango.push(pagina);
        anterior = pagina;
    }
    return rango;
}

function renderizarPaginacion(totalPaginas, paginaActual) {
    if (!paginacionProyectos) return;

    paginacionProyectos.innerHTML = '';

    if (totalPaginas <= 1) return;

    construirRangoPaginas(totalPaginas, paginaActual).forEach((pagina) => {
        if (pagina === '...') {
            paginacionProyectos.innerHTML += `
                <li class="page-item disabled">
                    <span class="page-link border-0 bg-transparent text-dark">…</span>
                </li>
            `;
            return;
        }

        const activo = pagina === paginaActual ? 'active' : '';
        paginacionProyectos.innerHTML += `
            <li class="page-item ${activo}">
                <a class="page-link border-0 bg-transparent text-dark" href="#" data-pagina="${pagina}">${pagina}</a>
            </li>
        `;
    });
}

paginacionProyectos?.addEventListener('click', (e) => {
    const link = e.target.closest('[data-pagina]');
    if (!link) return;
    e.preventDefault();
    cargarProyectos(Number(link.dataset.pagina));
});

txtBuscar?.addEventListener('input', () => {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(() => {
        filtrosActuales.busqueda = txtBuscar.value.trim();
        cargarProyectos(1);
    }, 300);
});

document.querySelectorAll('#panelTipo .filter-opcion, #panelEstado .filter-opcion').forEach((opcion) => {
    opcion.addEventListener('click', () => {
        const panel = opcion.closest('.filter-panel');
        const wrapper = opcion.closest('.filter-wrapper');
        const boton = wrapper.querySelector('.filter-button');
        const tipoFiltro = boton.dataset.filtro;
        const texto = boton.querySelector('.filter-text');
        const valor = opcion.dataset.valor;

        panel.querySelectorAll('.filter-opcion').forEach((elemento) => elemento.classList.remove('seleccionada'));
        opcion.classList.add('seleccionada');
        texto.textContent = valor ? opcion.textContent : texto.dataset.textoDefault;
        filtrosActuales[tipoFiltro] = valor;

        cerrarPaneles();
        cargarProyectos(1);
    });
});

btnFecha?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof inputFecha?.showPicker === 'function') {
        inputFecha.showPicker();
    } else {
        inputFecha?.focus();
    }
});

inputFecha?.addEventListener('change', () => {
    const texto = btnFecha.querySelector('.filter-text');
    texto.textContent = inputFecha.value || texto.dataset.textoDefault;
    filtrosActuales.fecha = inputFecha.value;
    cargarProyectos(1);
});

btnActualizarProyecto?.addEventListener('click', () => cargarProyectos(1, true));

function cerrarPaneles(panelActual = null) {
    document.querySelectorAll('.filter-panel.abierto').forEach((panel) => {
        if (panel !== panelActual) panel.classList.remove('abierto');
    });
}

filtrosWrapper.forEach((wrapper) => {
    const boton = wrapper.querySelector('.filter-button, .notificaciones');
    const panel = wrapper.querySelector('.filter-panel');
    if (!boton || !panel) return;

    boton.addEventListener('click', (e) => {
        e.stopPropagation();
        const abierto = panel.classList.contains('abierto');
        cerrarPaneles();
        if (!abierto) panel.classList.add('abierto');
    });
});

function mostrarMensaje(texto) {
    if (!contenedorProyectos) return;
    contenedorProyectos.innerHTML = `<p class="text-muted text-center w-100 my-4">${texto}</p>`;
}

function renderizarProyectos(proyectos) {
    if (!contenedorProyectos) return;

    contenedorProyectos.innerHTML = '';

    if (!proyectos.length) {
        contenedorProyectos.innerHTML = `<p class="text-muted text-center w-100 my-4">No se encontraron proyectos</p>`;
        return;
    }

    proyectos.forEach((proyecto) => {
        const tipoVisible = escapeHtml(obtenerTipoProyectoVisible(proyecto.tipoProyecto));
        const presupuesto = Number(proyecto.presupuestoEstimado || 0).toFixed(2);
        const total = Number(proyecto.gastoTotal || 0).toFixed(2);
        const estado = proyecto.finalizado ? 'Finalizado' : 'En progreso';

        contenedorProyectos.innerHTML += `
                <div class="ticket-card">
                    <div class="ticket-header d-flex flex-row gap-2 mb-2">
                        <i class="bi bi-hammer"></i>
                        <span class="dot">•</span>
                        <a href="vistaProyecto.html?id=${encodeURIComponent(proyecto.idProyecto)}"
                            class="titulo fs-5 stretched-link text-decoration-none text-dark">${escapeHtml(proyecto.nombreProyecto)}</a>
                    </div>
                    <div class="proyecto-details gap-3">
                    <div class="col-md-6">
                        <p class="ticket-info"><strong>Ubicación:</strong> ${escapeHtml(proyecto.ubicacion)}</p>
                        <p class="ticket-info"><strong>Tipo de proyecto:</strong> ${escapeHtml(tipoVisible)}</p>
                        <p class="ticket-info"><strong>Coordinador:</strong> ${escapeHtml(proyecto.nombreCoordinador)}</p>
                        <p class="ticket-info"><strong>Supervisor:</strong> ${escapeHtml(proyecto.nombreSupervisor)}</p>
                    </div>
                    <div class="col-md-6">
                        <p class="ticket-info"><strong>Presupuesto estimado:</strong> $${presupuesto}</p>
                        <p class="ticket-info"><strong>Gasto total:</strong> $${total}</p>
                        <p class="ticket-info"><strong>Estado:</strong> ${escapeHtml(estado)}</p>
                    </div>
                </div>

                <div class="proyecto-descripcion col-md-6">
                    <p class="ticket-info"><strong>Descripción:</strong></p>
                    <p class="ticket-info">${escapeHtml(proyecto.descripcionProyecto)}</p>
                </div>
                    </div>
                </div>
        `;
    });
}

function mostrarError(mensaje) {
    console.error(mensaje);
}

function escapeHtml(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


import { obtenerProyectos } from "../services/proyectoService.js";
import { mostrarError } from "../components/notificacionesUI.js";
import { iniciarTicketsStack, renderizarPaginacion as pintarPaginacionComun } from "../components/common.js";
import { obtenerRolUsuario, obtenerUsuarioLogueado } from "../utils/sesion.js";
import { obtenerFases } from "../services/fasesService.js";
import { getDepartamentoById } from "../services/departamentosService.js";

/* Permisos: el administrador ve todos los proyectos; el técnico solo los de su departamento.
   Un proyecto pertenece a un departamento por el campo departamentoEncargado de sus fases. */
const rolActual = obtenerRolUsuario();
if (rolActual === 'usuario') window.location.replace('misTickets.html');
const esTecnico = rolActual === 'tecnico';

let tipoDepartamentoTecnico;

async function obtenerTipoDepartamento() {
    if (tipoDepartamentoTecnico !== undefined) return tipoDepartamentoTecnico;

    const idDepartamento = obtenerUsuarioLogueado()?.idDepartamento;
    try {
        const departamento = idDepartamento ? await getDepartamentoById(idDepartamento) : null;
        tipoDepartamentoTecnico = departamento?.tipoDepartamento ?? null;
    } catch (error) {
        console.error('No se pudo obtener el departamento del técnico:', error);
        tipoDepartamentoTecnico = null;
    }
    return tipoDepartamentoTecnico;
}

async function filtrarProyectosPermitidos(lista) {
    if (!esTecnico || !lista?.length) return lista;

    const tipo = String(await obtenerTipoDepartamento() || '').toLowerCase();
    if (!tipo) return [];

    const fases = await obtenerFases();
    const permitidos = new Set(
        fases
            .filter((fase) => {
                const encargado = String(fase.departamentoEncargado || '').toLowerCase();
                return encargado === tipo || encargado === 'ambos';
            })
            .map((fase) => fase.proyecto)
    );

    return lista.filter((proyecto) => permitidos.has(proyecto.idProyecto));
}

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

// Los filtros de proyectos se aplican en esta pantalla.
async function cargarProyectos(pagina = 1, recargar = false) {
    if (!contenedorProyectos) return;

    try {
        if (recargar || !proyectos.length) {
            const resultado = await obtenerProyectos();
            proyectos = await filtrarProyectosPermitidos(Array.isArray(resultado) ? resultado : []);
        }

        const proyectosFiltrados = filtrarProyectos(proyectos);
        const totalPaginas = Math.ceil(proyectosFiltrados.length / TAMANO_PAGINA_PROYECTOS);
        paginaActualProyectos = totalPaginas ? Math.min(pagina, totalPaginas) : 1;
        const inicio = (paginaActualProyectos - 1) * TAMANO_PAGINA_PROYECTOS;
        const lista = proyectosFiltrados.slice(inicio, inicio + TAMANO_PAGINA_PROYECTOS);

        renderizarProyectos(lista);
        renderizarPaginacion(totalPaginas, paginaActualProyectos);

        if (infoProyectos) {
            const desde = lista.length ? inicio + 1 : 0;
            const hasta = lista.length ? inicio + lista.length : 0;
            infoProyectos.textContent = lista.length
                ? `Mostrando ${desde}-${hasta} de ${proyectosFiltrados.length}`
                : '';
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

function renderizarPaginacion(totalPaginas, paginaActual) {
    pintarPaginacionComun(paginacionProyectos, paginaActual, totalPaginas, cargarProyectos);
}

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
    texto.textContent = inputFecha.value || texto.dataset.textoDefault || 'Fecha';
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

    if (!proyectos.length) {
        contenedorProyectos.innerHTML = `<p class="text-muted text-center w-100 my-4">No se encontraron proyectos</p>`;
        return;
    }

    contenedorProyectos.innerHTML = proyectos.map((proyecto) => {
        const tipoVisible = escapeHtml(obtenerTipoProyectoVisible(proyecto.tipoProyecto));
        const presupuesto = Number(proyecto.presupuestoEstimado || 0).toFixed(2);
        const total = Number(proyecto.gastoTotal || 0).toFixed(2);
        const estado = proyecto.finalizado ? 'Finalizado' : 'En progreso';

        return `
                <article class="ticket-card proyecto-card" data-url="vistaProyecto.html?id=${encodeURIComponent(proyecto.idProyecto)}">
                    <header class="ticket-header">
                      <div class="ticket-title-group">
                        <i class="bi bi-gear proyecto-icono" aria-hidden="true"></i>
                        <span class="dot">•</span>
                        <h2 class="ticket-title texto-limitado-2">${escapeHtml(proyecto.nombreProyecto || 'Proyecto sin nombre')}</h2>
                      </div>
                      <div class="header-actions">
                        <span class="badge estado-proyecto ${proyecto.finalizado ? 'finalizado' : 'en-progreso'}">${estado}</span>
                      </div>
                    </header>
                    <div class="ticket-details proyecto-details">
                        <p class="ticket-info"><strong>Ubicación:</strong> ${escapeHtml(proyecto.ubicacion || '—')}</p>
                        <p class="ticket-info"><strong>Tipo:</strong> ${tipoVisible}</p>
                        <p class="ticket-info"><strong>Coordinador:</strong> ${escapeHtml(proyecto.nombreCoordinador || '—')}</p>
                        <p class="ticket-info"><strong>Supervisor:</strong> ${escapeHtml(proyecto.nombreSupervisor || '—')}</p>
                        <p class="ticket-info"><strong>Presupuesto:</strong> $${presupuesto}</p>
                        <p class="ticket-info"><strong>Gasto total:</strong> $${total}</p>
                    </div>
                    <div class="ticket-description proyecto-descripcion">
                        <p class="description-title">Descripción:</p>
                        <p class="description-text">${escapeHtml(proyecto.descripcionProyecto || 'Sin descripción')}</p>
                    </div>
                </article>
        `;
    }).join('');

    iniciarTicketsStack(contenedorProyectos);
}

function escapeHtml(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


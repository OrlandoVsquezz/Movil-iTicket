import { obtenerProyectos } from "../services/proyectoService.js";

const contenedorProyectos = document.getElementById('contenedorProyectos');


document.addEventListener('DOMContentLoaded', () => {
    cargarProyectos();
});

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

async function cargarProyectos() {
    if (!contenedorProyectos) return;

    try {
        const proyectos = await obtenerProyectos();
        const lista = Array.isArray(proyectos) ? proyectos : [];

        renderizarProyectos(lista);
    } catch (error) {
        contenedorProyectos.innerHTML = `<p class="text-danger text-center w-100 my-4">No se pudieron cargar los proyectos</p>`;
        mostrarError(error?.message || 'Error desconocido al cargar proyectos');
    }
}

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


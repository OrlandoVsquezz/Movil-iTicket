import { obtenerFasesPorProyecto } from "../services/fasesService.js";
import { obtenerDetallesPorFase, crearDetalleFase, editarDetallesFase, eliminarDetallesFase } from "../services/detallesFaseService.js";
import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/notificacionesUI.js";
import { validarFormularioDetalleFase } from "../validators/detalleFaseValidators.js";
import { obtenerRolUsuario, obtenerUsuarioLogueado } from "../utils/sesion.js";
import { getDepartamentoById } from "../services/departamentosService.js";

/* El técnico consulta las fases y sus detalles, pero no puede crearlos, editarlos ni borrarlos */
const soloLectura = obtenerRolUsuario() === 'tecnico';

const selectFase = document.getElementById('selectFase');
const tarjetaFaseSeleccionada = document.getElementById('tarjetaFaseSeleccionada');
const tarjetaDetallesFase = document.getElementById('tarjetaDetallesFase');
const btnEditarDetallesFase = document.getElementById('btnEditarDetallesFase');
const btnAgregarDetalleFase = document.getElementById('btnAgregarDetalleFase');
const dialogAgregarDetalle = document.getElementById('dialogAgregarDetalle');
const formAgregarDetalleFase = document.getElementById('formAgregarDetalleFase');
const txtNuevoDetalleFase = document.getElementById('txtNuevoDetalleFase');
const btnCancelarDetalleFase = document.getElementById('btnCancelarDetalleFase');

if (soloLectura) {
    btnEditarDetallesFase?.remove();
    btnAgregarDetalleFase?.remove();
}

let fases = [];
let detallesActuales = [];
let idProyectoActual = null;
let idFaseSeleccionada = null;
let modoEdicionDetalles = false;

function escaparHtml(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function obtenerIdProyectoDesdeURL() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get('id');
}

function verificarAccesoProyecto() {
    idProyectoActual = obtenerIdProyectoDesdeURL();
    if (!idProyectoActual) {
        window.location.href = 'proyectos.html';
        return false;
    }
    return true;
}

export function obtenerFasePorId(id) {
    return fases.find((fase) => String(fase.idFase) === String(id));
}

function mostrarSinFases() {
    idFaseSeleccionada = null;
    detallesActuales = [];
    selectFase.innerHTML = '<option value="" selected>No hay fases asignadas</option>';
    tarjetaFaseSeleccionada.innerHTML = '<p class="text-muted mb-0">Este proyecto no tiene fases asignadas.</p>';
    tarjetaDetallesFase.innerHTML = '<p class="text-muted mb-0">No hay detalles para mostrar.</p>';
}

function renderizarSelectFases() {
    if (!fases.length) {
        mostrarSinFases();
        return;
    }

    selectFase.innerHTML = '<option value="" selected>Selecciona una fase</option>';
    fases.forEach((fase) => {
        const option = document.createElement('option');
        option.value = fase.idFase;
        option.textContent = fase.nombreFase;
        selectFase.appendChild(option);
    });
}

/* El técnico solo puede abrir proyectos con alguna fase de su departamento (o "Ambos"),
   aunque llegue por un enlace directo */
async function puedeVerElProyecto(fasesDelProyecto) {
    if (!soloLectura) return true;

    let tipo = '';
    try {
        const idDepartamento = obtenerUsuarioLogueado()?.idDepartamento;
        const departamento = idDepartamento ? await getDepartamentoById(idDepartamento) : null;
        tipo = String(departamento?.tipoDepartamento || '').toLowerCase();
    } catch (error) {
        console.error('No se pudo obtener el departamento del técnico:', error);
    }

    return (fasesDelProyecto || []).some((fase) => {
        const encargado = String(fase.departamentoEncargado || '').toLowerCase();
        return tipo && (encargado === tipo || encargado === 'ambos');
    });
}

async function cargarFases() {
    try {
        const respuesta = await obtenerFasesPorProyecto(idProyectoActual);
        fases = Array.isArray(respuesta) ? respuesta : [];

        if (!(await puedeVerElProyecto(fases))) {
            mostrarError('Este proyecto no pertenece a tu departamento.');
            window.location.replace('proyectos.html');
            return;
        }

        renderizarSelectFases();
    } catch (error) {
        fases = [];
        selectFase.innerHTML = '<option value="" selected>No se pudieron cargar las fases</option>';
        tarjetaFaseSeleccionada.innerHTML = '<p class="text-danger mb-0">No se pudieron cargar las fases asignadas.</p>';
        tarjetaDetallesFase.innerHTML = '<p class="text-muted mb-0">No hay detalles para mostrar.</p>';
        console.error('Error al cargar las fases del proyecto:', error);
    }
}

function mostrarFaseSeleccionada(idFase) {
    if (!idFase) {
        tarjetaFaseSeleccionada.innerHTML = '<p class="text-muted mb-0">Selecciona una fase para ver su información.</p>';
        return;
    }

    const fase = obtenerFasePorId(idFase);
    if (!fase) return;

    tarjetaFaseSeleccionada.innerHTML = `
        <h6 class="texto-detalles fw-bold mb-2">${escaparHtml(fase.nombreFase)}</h6>
        <p class="ticket-info"><strong>Departamento encargado:</strong> ${escaparHtml(fase.departamentoEncargado || '—')}</p>
        <p class="ticket-info"><strong>Descripción:</strong> ${escaparHtml(fase.faseDescripcion || '—')}</p>
        <p class="ticket-info"><strong>Inicio estimado:</strong> ${escaparHtml(fase.fechaInicioEstimada || '—')}</p>
        <p class="ticket-info"><strong>Final estimado:</strong> ${escaparHtml(fase.fechaFinalEstimada || '—')}</p>
        <p class="ticket-info"><strong>Inicio real:</strong> ${escaparHtml(fase.fechaInicioReal || '—')}</p>
        <p class="ticket-info"><strong>Final real:</strong> ${escaparHtml(fase.fechaFinalReal || '—')}</p>
        <p class="ticket-info"><strong>Proveedor:</strong> ${escaparHtml(fase.nombreProveedor || 'N/A')}</p>
        <p class="ticket-info"><strong>Presupuesto estimado:</strong> $${Number(fase.presupuestoEstimado || 0).toFixed(2)}</p>
        <p class="ticket-info"><strong>Gasto total:</strong> $${Number(fase.gastoTotal || 0).toFixed(2)}</p>
        <p class="ticket-info"><strong>Estado:</strong> ${fase.finalizado ? 'Finalizada' : 'En progreso'}</p>
    `;
}

function ocultarFormularioDetalle() {
    if (dialogAgregarDetalle?.open) dialogAgregarDetalle.close();
    if (txtNuevoDetalleFase) txtNuevoDetalleFase.value = '';
}

function renderizarListaDetalles() {
    if (!idFaseSeleccionada) {
        tarjetaDetallesFase.innerHTML = '<p class="text-muted mb-0">Selecciona una fase para ver sus detalles.</p>';
        return;
    }

    if (!detallesActuales.length) {
        tarjetaDetallesFase.innerHTML = '<p class="text-muted mb-0">Esta fase aún no tiene detalles.</p>';
        return;
    }

    const items = detallesActuales.map((detalle) => `
        <li class="d-flex align-items-center justify-content-between gap-2 py-2 border-bottom">
            <div class="d-flex align-items-center gap-2 flex-grow-1">
                <input type="checkbox" class="form-check-input chkDetalleCompletado" data-id-detalle="${detalle.idDetalleFase}" ${detalle.completado ? 'checked' : ''} ${soloLectura ? 'disabled' : ''}>
                <span class="${detalle.completado ? 'text-decoration-line-through' : ''} ticket-info titulo">${escaparHtml(detalle.descripcionDetalle)}</span>
            </div>
            <i class="bi bi-trash btnEliminarDetalle text-danger ${modoEdicionDetalles ? '' : 'd-none'}" data-id-detalle="${detalle.idDetalleFase}" title="Eliminar"></i>
        </li>
    `).join('');

    tarjetaDetallesFase.innerHTML = `<ul class="list-unstyled mb-0">${items}</ul>`;
}

async function cargarDetalles(idFase) {
    try {
        const respuesta = await obtenerDetallesPorFase(idFase);
        detallesActuales = Array.isArray(respuesta) ? respuesta : [];
        renderizarListaDetalles();
    } catch (error) {
        detallesActuales = [];
        tarjetaDetallesFase.innerHTML = '<p class="text-danger mb-0">No se pudieron cargar los detalles de la fase.</p>';
        console.error('Error al cargar los detalles de la fase:', error);
    }
}

selectFase?.addEventListener('change', () => {
    idFaseSeleccionada = selectFase.value || null;
    modoEdicionDetalles = false;
    ocultarFormularioDetalle();
    mostrarFaseSeleccionada(idFaseSeleccionada);

    if (idFaseSeleccionada) {
        cargarDetalles(idFaseSeleccionada);
    } else {
        detallesActuales = [];
        renderizarListaDetalles();
    }
});

btnEditarDetallesFase?.addEventListener('click', () => {
    if (!idFaseSeleccionada) {
        mostrarError('Selecciona una fase para editar sus detalles.');
        return;
    }

    modoEdicionDetalles = !modoEdicionDetalles;
    renderizarListaDetalles();
});

btnAgregarDetalleFase?.addEventListener('click', () => {
    if (!idFaseSeleccionada) {
        mostrarError('Selecciona una fase para agregar un detalle.');
        return;
    }

    if (txtNuevoDetalleFase) txtNuevoDetalleFase.value = '';
    dialogAgregarDetalle?.showModal();
    txtNuevoDetalleFase?.focus();
});

btnCancelarDetalleFase?.addEventListener('click', ocultarFormularioDetalle);

dialogAgregarDetalle?.addEventListener('click', (event) => {
    if (event.target === dialogAgregarDetalle) ocultarFormularioDetalle();
});

formAgregarDetalleFase?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const descripcion = txtNuevoDetalleFase?.value ?? '';
    const errores = validarFormularioDetalleFase({
        descripcionDetalle: descripcion,
        idFase: idFaseSeleccionada
    });

    if (errores.length) {
        mostrarError(errores[0]);
        return;
    }

    try {
        await crearDetalleFase({
            descripcionDetalle: descripcion.trim(),
            completado: false,
            fase: Number(idFaseSeleccionada)
        });
        mostrarExitoSimple('¡Listo!', 'El detalle se agregó correctamente.');
        ocultarFormularioDetalle();
        await cargarDetalles(idFaseSeleccionada);
    } catch (error) {
        mostrarError(error.message);
    }
});

tarjetaDetallesFase?.addEventListener('change', async (event) => {
    if (!event.target.matches('.chkDetalleCompletado')) return;

    const idDetalle = event.target.dataset.idDetalle;
    const detalle = detallesActuales.find((item) => String(item.idDetalleFase) === String(idDetalle));
    if (!detalle) return;

    const nuevoEstado = event.target.checked;
    try {
        await editarDetallesFase(idDetalle, {
            descripcionDetalle: detalle.descripcionDetalle,
            completado: nuevoEstado,
            fase: Number(idFaseSeleccionada)
        });
        detalle.completado = nuevoEstado;
        renderizarListaDetalles();
        mostrarExitoSimple(
            nuevoEstado ? 'Detalle completado' : 'Detalle reabierto',
            nuevoEstado ? 'El detalle quedó marcado como completado.' : 'El detalle volvió a quedar pendiente.'
        );
    } catch (error) {
        event.target.checked = !nuevoEstado;
        mostrarError(error.message);
    }
});

tarjetaDetallesFase?.addEventListener('click', async (event) => {
    if (!event.target.matches('.btnEliminarDetalle')) return;

    const idDetalle = event.target.dataset.idDetalle;
    const confirmar = await mostrarConfirmacion(
        'Eliminar detalle',
        '¿Deseas eliminar este detalle? Esta acción no se puede deshacer.'
    );
    if (!confirmar) return;

    try {
        await eliminarDetallesFase(idDetalle);
        detallesActuales = detallesActuales.filter((item) => String(item.idDetalleFase) !== String(idDetalle));
        renderizarListaDetalles();
        mostrarExitoSimple('¡Listo!', 'El detalle se eliminó correctamente.');
    } catch (error) {
        mostrarError(error.message);
    }
});

export function inicializarVistaProyecto() {
    if (!verificarAccesoProyecto()) return;
    cargarFases();
}

document.addEventListener('DOMContentLoaded', inicializarVistaProyecto);

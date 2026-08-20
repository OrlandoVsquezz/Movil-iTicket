import { obtenerFasesPorProyecto } from "../services/fasesService.js";
import { obtenerDetallesPorFase, crearDetalleFase, editarDetallesFase, eliminarDetallesFase } from "../services/detallesFaseService.js";
import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/sweetAlerts.js";
import { validarFormularioDetalleFase } from "../validators/detalleFaseValidators.js";

/* Referencias del DOM */
const selectFase = document.getElementById('selectFase');
const tarjetaFaseSeleccionada = document.getElementById('tarjetaFaseSeleccionada');
const tarjetaDetallesFase = document.getElementById('tarjetaDetallesFase');
const btnEditarDetallesFase = document.getElementById('btnEditarDetallesFase');
const btnAgregarDetalleFase = document.getElementById('btnAgregarDetalleFase');
const dialogAgregarDetalle = document.getElementById('dialogAgregarDetalle');
const formAgregarDetalleFase = document.getElementById('formAgregarDetalleFase');
const txtNuevoDetalleFase = document.getElementById('txtNuevoDetalleFase');
const btnCancelarDetalleFase = document.getElementById('btnCancelarDetalleFase');
const filtrosWrapper = document.querySelectorAll('.filter-wrapper');

let fases = [];
let detallesActuales = [];
let idProyectoActual = null;
let idFaseSeleccionada = null;
let modoEdicionDetalles = false;

document.addEventListener('click', () => cerrarPaneles());

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

/* Obtiene el id del proyecto desde la URL (?id=), igual que en vistaTicket.js */
function obtenerIdProyectoDesdeURL() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get('id');
}

/* Se asegura de que si no se está referenciando a ningún proyecto, no se pueda acceder a la interfaz de vista de proyecto */
function verificarAccesoProyecto() {
    idProyectoActual = obtenerIdProyectoDesdeURL();
    if (!idProyectoActual) {
        window.location.href = 'proyectos.html';
        return false;
    }
    return true;
}

/* Obtiene una fase por su ID */
export function obtenerFasePorId(id) {
    return fases.find(f => String(f.idFase) === String(id));
}

/* Renderiza el select de fases */
function renderizarSelectFases() {
    selectFase.innerHTML = '<option value="" selected>Selecciona una fase</option>';
    fases.forEach(f => {
        const option = document.createElement('option');
        option.value = f.idFase;
        option.textContent = f.nombreFase;
        selectFase.appendChild(option);
    });
}

/* Carga las fases del proyecto actual desde la API */
async function cargarFases() {
    try {
        fases = await obtenerFasesPorProyecto(idProyectoActual);
        renderizarSelectFases();
    } catch (error) {
        selectFase.innerHTML = '<option value="" selected>No se pudieron cargar las fases</option>';
        console.error('Error al cargar las fases del proyecto:', error);
    }
}

/* Muestra la información básica de la fase seleccionada */
function mostrarFaseSeleccionada(idFase) {
    if (!idFase) {
        tarjetaFaseSeleccionada.innerHTML = '<p class="text-muted mb-0">Selecciona una fase para ver su información.</p>';
        return;
    }

    const fase = obtenerFasePorId(idFase);
    if (!fase) return;

    tarjetaFaseSeleccionada.innerHTML = `
        <h6 class="texto-detalles fw-bold mb-2">${fase.nombreFase}</h6>
        <p class="ticket-info"><strong>Departamento encargado:</strong> ${fase.departamentoEncargado}</p>
        <p class="ticket-info"><strong>Descripción:</strong> ${fase.faseDescripcion}</p>
        <p class="ticket-info"><strong>Inicio estimado:</strong> ${fase.fechaInicioEstimada}</p>
        <p class="ticket-info"><strong>Final estimado:</strong> ${fase.fechaFinalEstimada}</p>
        <p class="ticket-info"><strong>Inicio real:</strong> ${fase.fechaInicioReal || '—'}</p>
        <p class="ticket-info"><strong>Final real:</strong> ${fase.fechaFinalReal || '—'}</p>
        <p class="ticket-info"><strong>Proveedor:</strong> ${fase.nombreProveedor || 'N/A'}</p>
        <p class="ticket-info"><strong>Presupuesto estimado:</strong> $${Number(fase.presupuestoEstimado).toFixed(2)}</p>
        <p class="ticket-info"><strong>Gasto total:</strong> $${Number(fase.gastoTotal || 0).toFixed(2)}</p>
        <p class="ticket-info"><strong>Estado:</strong> ${fase.finalizado ? 'Finalizada' : 'En progreso'}</p>
    `;
}

/* Cierra el dialogo de "Agregar detalle" y lo limpia */
function ocultarFormularioDetalle() {
    if (dialogAgregarDetalle?.open) dialogAgregarDetalle.close();
    if (txtNuevoDetalleFase) txtNuevoDetalleFase.value = '';
}

/* Renderiza la lista de detalles de la fase seleccionada dentro de tarjetaDetallesFase */
function renderizarListaDetalles() {
    if (!idFaseSeleccionada) {
        tarjetaDetallesFase.innerHTML = '<p class="text-muted mb-0">Selecciona una fase para ver sus detalles.</p>';
        return;
    }

    if (!detallesActuales.length) {
        tarjetaDetallesFase.innerHTML = '<p class="text-muted mb-0">Esta fase aún no tiene detalles.</p>';
        return;
    }

    const items = detallesActuales.map(d => `
        <li class="d-flex align-items-center justify-content-between gap-2 py-2 border-bottom">
            <div class="d-flex align-items-center gap-2 flex-grow-1">
                <input type="checkbox" class="form-check-input chkDetalleCompletado" data-id-detalle="${d.idDetalleFase}" ${d.completado ? 'checked' : ''}>
                <span class="${d.completado ? 'text-decoration-line-through' : ''} ticket-info titulo">${d.descripcionDetalle}</span>
            </div>
            <i class="bi bi-trash btnEliminarDetalle text-danger ${modoEdicionDetalles ? '' : 'd-none'}" data-id-detalle="${d.idDetalleFase}" title="Eliminar"></i>
        </li>
    `).join('');

    tarjetaDetallesFase.innerHTML = `<ul class="list-unstyled mb-0">${items}</ul>`;
}

/* Carga los detalles de la fase indicada desde la API */
async function cargarDetalles(idFase) {
    try {
        detallesActuales = await obtenerDetallesPorFase(idFase);
        renderizarListaDetalles();
    } catch (error) {
        detallesActuales = [];
        tarjetaDetallesFase.innerHTML = '<p class="text-danger mb-0">No se pudieron cargar los detalles de la fase.</p>';
        console.error('Error al cargar los detalles de la fase:', error);
    }
}

/* Selección de fase: pinta su información y carga sus detalles */
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

/* Alterna el modo edición: muestra u oculta los botones de eliminar de cada detalle */
btnEditarDetallesFase?.addEventListener('click', () => {
    if (!idFaseSeleccionada) {
        mostrarError('Selecciona una fase para editar sus detalles.');
        return;
    }
    modoEdicionDetalles = !modoEdicionDetalles;
    renderizarListaDetalles();
});

/* Abre el dialogo para agregar un nuevo detalle a la fase seleccionada */
btnAgregarDetalleFase?.addEventListener('click', () => {
    if (!idFaseSeleccionada) {
        mostrarError('Selecciona una fase para agregar un detalle.');
        return;
    }
    if (txtNuevoDetalleFase) txtNuevoDetalleFase.value = '';
    dialogAgregarDetalle?.showModal();
    txtNuevoDetalleFase?.focus();
});

btnCancelarDetalleFase?.addEventListener('click', () => ocultarFormularioDetalle());

/* Cierra el dialogo al hacer click sobre el backdrop (fuera del contenido) */
dialogAgregarDetalle?.addEventListener('click', (e) => {
    if (e.target === dialogAgregarDetalle) dialogAgregarDetalle.close();
});

/* Envía el nuevo detalle a la API (POST) */
formAgregarDetalleFase?.addEventListener('submit', async (e) => {
    e.preventDefault();

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
        mostrarExitoSimple('¡Listo!', 'El detalle se agregó correctamente');
        ocultarFormularioDetalle();
        await cargarDetalles(idFaseSeleccionada);
    } catch (error) {
        mostrarError(error.message);
    }
});

/* Marca/desmarca un detalle como completado (PUT) */
tarjetaDetallesFase?.addEventListener('change', async (e) => {
    if (!e.target.matches('.chkDetalleCompletado')) return;

    const idDetalle = e.target.dataset.idDetalle;
    const detalle = detallesActuales.find(d => String(d.idDetalleFase) === String(idDetalle));
    if (!detalle) return;

    const nuevoEstado = e.target.checked;
    try {
        await editarDetallesFase(idDetalle, {
            descripcionDetalle: detalle.descripcionDetalle,
            completado: nuevoEstado,
            fase: Number(idFaseSeleccionada)
        });
        detalle.completado = nuevoEstado;
        renderizarListaDetalles();
    } catch (error) {
        e.target.checked = !nuevoEstado;
        mostrarError(error.message);
    }
});

/* Elimina un detalle de la fase (DELETE) */
tarjetaDetallesFase?.addEventListener('click', async (e) => {
    if (!e.target.matches('.btnEliminarDetalle')) return;

    const idDetalle = e.target.dataset.idDetalle;
    const confirmar = await mostrarConfirmacion('¿Deseas eliminar este detalle? Esta acción no se puede deshacer.');
    if (!confirmar) return;

    try {
        await eliminarDetallesFase(idDetalle);
        detallesActuales = detallesActuales.filter(d => String(d.idDetalleFase) !== String(idDetalle));
        renderizarListaDetalles();
        mostrarExitoSimple('¡Listo!', 'El detalle se eliminó correctamente');
    } catch (error) {
        mostrarError(error.message);
    }
});

/* Inicializa la vista de proyecto */
export function inicializarVistaProyecto() {
    if (!verificarAccesoProyecto()) return;
    cargarFases();
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarVistaProyecto();
});


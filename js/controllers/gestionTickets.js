import {
    asignarTicket,
    actualizarDepartamento,
    getAprobacionesPendientes,
    getTicket,
    getTicketsPorDepartamento,
    eliminarTicket
} from "../services/ticketsService.js";
import { getTecnicosPorDepartamento } from "../services/usuariosService.js";
import { getDepartamentosAsignables } from "../services/departamentosService.js";
import {
    mostrarConfirmacion,
    mostrarError,
    mostrarExitoSimple
} from "../components/notificacionesUI.js";
import { formatearFecha12H, formatearParaDateTimeLocal } from "../utils/formateadores.js";
import { obtenerIdUsuario } from "../utils/sesion.js";
import { iniciarTicketsStack, renderizarPaginacion } from "../components/common.js";

const LIMITE_PENDIENTES = 5;
const TAMANO_PAGINA_API = 5;
const TAMANO_CONSULTA_API = 50;
let paginaTodos = 1;
const filtrosTodos = {};
let solicitudTodos = 0;

const ticketsPendientes = document.getElementById("ticketsPendientes");
const todosTickets = document.getElementById("todosTickets");
const dialogAprobacion = document.getElementById("dialogAprobacion");
const cerrarDialog = document.getElementById("cerrarDialog");
const formAprobacion = document.getElementById("formAprobacion");
const eliminarTicketAprobacion = document.getElementById("eliminarTicketAprobacion");
const DURACION_CIERRE_DIALOGO = 420;
const abrirCambioDepartamento = document.getElementById("abrirCambioDepartamento");
const dialogDepartamento = document.getElementById("dialogDepartamento");
const cerrarDialogDepartamento = document.getElementById("cerrarDialogDepartamento");
const cancelarCambioDepartamento = document.getElementById("cancelarCambioDepartamento");
const formDepartamento = document.getElementById("formDepartamento");
const visorEvidencias = document.getElementById("visorEvidencias");
const cerrarVisorEvidencias = document.getElementById("cerrarVisorEvidencias");
const fotoEvidenciaActual = document.getElementById("fotoEvidenciaActual");
const contadorEvidencias = document.getElementById("contadorEvidencias");
const miniaturasEvidencias = document.getElementById("miniaturasEvidencias");
const evidenciaAnterior = document.getElementById("evidenciaAnterior");
const evidenciaSiguiente = document.getElementById("evidenciaSiguiente");
const sltPrioridad = document.getElementById("sltPrioridad");
const fechaVencimiento = document.getElementById("fechaVencimiento");
const sltTecnico = document.getElementById("sltTecnico");
const sltDepartamentoDialog = document.getElementById("sltDepartamentoDialog");

const idUsuario = obtenerIdUsuario();

let idTicketSeleccionado = null;
let departamentoTicketActual = null;
let departamentosDisponibles = [];
let evidenciasActuales = [];
let indiceEvidenciaActual = 0;
let cargandoAccion = false;
let posicionScrollBloqueada = 0;
let estilosBodyAntesDelDialog = null;

function escaparHtml(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function nombrePrioridad(prioridad) {
    return prioridad === "Critica" ? "Crítica" : prioridad;
}

function clasePrioridad(prioridad) {
    return ["Baja", "Media", "Alta", "Critica"].includes(prioridad) ? prioridad : "";
}

function claseIconoPrioridad(prioridad) {
    const prioridadNormalizada = String(prioridad || "").trim().toLowerCase();
    if (prioridadNormalizada === "critica" || prioridadNormalizada === "crítica") {
        return "icono-ticket-prioridad-critica";
    }
    if (prioridadNormalizada === "alta") return "icono-ticket-prioridad-alta";
    if (prioridadNormalizada === "media") return "icono-ticket-prioridad-media";
    if (prioridadNormalizada === "baja") return "icono-ticket-prioridad-baja";
    return "icono-ticket-prioridad-sin-asignar";
}

function plantillaTicket(ticket, pendiente = false) {
    const prioridad = pendiente ? "" : clasePrioridad(ticket.prioridad);
    const claseIcono = claseIconoPrioridad(pendiente ? null : ticket.prioridad);
    const insigniaPrioridad = prioridad
        ? `<span class="badge prioridad-${prioridad}">${escaparHtml(nombrePrioridad(prioridad))}</span>`
        : "";
    const tecnico = ticket.nombreTecnico || "Sin asignar";

    return `
        <article class="ticket-card ${pendiente ? "ticket-gestion-pendiente" : ""}"
            data-id-ticket="${Number(ticket.idTicket)}"
            data-url="vistaTicket.html?id=${Number(ticket.idTicket)}">
            <header class="ticket-header">
                <div class="ticket-title-group">
                    <i class="bi bi-ticket-perforated ${claseIcono}" aria-hidden="true"></i>
                    <span class="dot">•</span>
                    <h2 class="ticket-title texto-limitado-2">${escaparHtml(ticket.asunto)}</h2>
                </div>
                <div class="header-actions">
                    ${insigniaPrioridad}
                </div>
            </header>
            <div class="ticket-details">
                <p class="ticket-code">${escaparHtml(ticket.codigo)}</p>
                <p class="ticket-info"><strong>Estado:</strong> ${escaparHtml(ticket.estado)}</p>
                <p class="ticket-info"><strong>Técnico asignado:</strong> ${escaparHtml(tecnico)}</p>
                <p class="ticket-info"><strong>Creado:</strong> ${escaparHtml(formatearFecha12H(ticket.fechaCreacion))}</p>
            </div>
            <div class="ticket-description">
                <p class="description-title">Descripción:</p>
                <p class="description-text texto-limitado">${escaparHtml(ticket.descripcion)}</p>
            </div>
        </article>
    `;
}

function mostrarMensaje(contenedor, mensaje) {
    contenedor.innerHTML = `<p class="texto">${escaparHtml(mensaje)}</p>`;
}

function renderizarPendientes(tickets) {
    tickets = (tickets || []).filter(ticket => ticket.estado === "Nuevo");
    if (!tickets?.length) {
        mostrarMensaje(ticketsPendientes, "No hay aprobaciones pendientes.");
        return;
    }

    ticketsPendientes.innerHTML = tickets.map((ticket) => plantillaTicket(ticket, true)).join("");
}

function renderizarTodos(resultado) {
    const tickets = resultado?.tickets || [];
    paginaTodos = Number(resultado?.paginaActual) || 1;
    const totalPaginas = Number(resultado?.totalPaginas) || 0;
    renderizarPaginacion(
        document.getElementById("paginacionGestion"),
        paginaTodos,
        totalPaginas,
        cargarTodos,
        { seguirPaginaActual: true }
    );
    document.getElementById("infoTickets").textContent = tickets.length
        ? `Mostrando ${(paginaTodos - 1) * TAMANO_PAGINA_API + 1}-${(paginaTodos - 1) * TAMANO_PAGINA_API + tickets.length} de ${resultado.totalElementos}`
        : "No se encontraron tickets.";
    if (!tickets?.length) {
        mostrarMensaje(todosTickets, "No hay tickets para mostrar.");
        return;
    }

    todosTickets.innerHTML = tickets.map((ticket) => plantillaTicket(ticket)).join("");
    iniciarTicketsStack(todosTickets);
}

async function obtenerTodosLosTickets() {
    const primeraPagina = await getTicketsPorDepartamento(idUsuario, 1, TAMANO_CONSULTA_API, filtrosTodos);
    const tickets = [...(primeraPagina?.tickets || [])];
    const totalPaginasApi = Number(primeraPagina?.totalPaginas) || 1;

    if (totalPaginasApi > 1) {
        const solicitudes = [];
        for (let pagina = 2; pagina <= totalPaginasApi; pagina += 1) {
            solicitudes.push(getTicketsPorDepartamento(idUsuario, pagina, TAMANO_CONSULTA_API, filtrosTodos));
        }
        const paginas = await Promise.all(solicitudes);
        paginas.forEach(resultado => tickets.push(...(resultado?.tickets || [])));
    }

    return tickets.filter(ticket => ticket.estado !== "Nuevo");
}

async function cargarTodos(pagina = 1) {
    const solicitud = ++solicitudTodos;
    paginaTodos = pagina;
    todosTickets._iticketStackController?.abort();
    todosTickets._iticketResizeObserver?.disconnect();
    todosTickets.style.minHeight = "0px";
    mostrarMensaje(todosTickets, "Cargando tickets...");
    document.getElementById("paginacionGestion").replaceChildren();
    document.getElementById("infoTickets").textContent = "";
    try {
        const ticketsAprobados = await obtenerTodosLosTickets();
        const totalElementos = ticketsAprobados.length;
        const totalPaginas = Math.ceil(totalElementos / TAMANO_PAGINA_API);
        paginaTodos = Math.min(Math.max(1, pagina), Math.max(1, totalPaginas));
        const inicio = (paginaTodos - 1) * TAMANO_PAGINA_API;
        const resultado = {
            tickets: ticketsAprobados.slice(inicio, inicio + TAMANO_PAGINA_API),
            paginaActual: paginaTodos,
            totalPaginas,
            totalElementos
        };
        if (solicitud === solicitudTodos) renderizarTodos(resultado);
    } catch (error) {
        if (solicitud !== solicitudTodos) return;
        mostrarMensaje(todosTickets, "No se pudieron cargar los tickets. Intenta de nuevo.");
        mostrarError("No se pudieron cargar los tickets.");
    }
}

async function recargarGestionTickets() {
    mostrarMensaje(ticketsPendientes, "Cargando aprobaciones...");
    mostrarMensaje(todosTickets, "Cargando tickets...");

    const [resultadoPendientes, resultadoTodos] = await Promise.allSettled([
        getAprobacionesPendientes(LIMITE_PENDIENTES, idUsuario),
        cargarTodos(paginaTodos)
    ]);

    if (resultadoPendientes.status === "fulfilled") {
        renderizarPendientes(resultadoPendientes.value || []);
    } else {
        mostrarMensaje(ticketsPendientes, "No se pudieron cargar las aprobaciones.");
        console.error("Error al cargar aprobaciones pendientes:", resultadoPendientes.reason);
    }

    if (resultadoTodos.status === "rejected") {
        mostrarMensaje(todosTickets, "No se pudieron cargar los tickets.");
        console.error("Error al cargar los tickets del departamento:", resultadoTodos.reason);
    }

    if (resultadoPendientes.status === "rejected" || resultadoTodos.status === "rejected") {
        mostrarError("No fue posible cargar toda la información de Gestión.");
    }
}

function normalizarEvidencias(evidencias) {
    if (!Array.isArray(evidencias)) return [];
    return evidencias
        .map((evidencia) => typeof evidencia === "string"
            ? evidencia
            : evidencia?.url || evidencia?.ruta || evidencia?.archivo)
        .filter(Boolean);
}

function renderizarEvidencias(evidencias) {
    const contenedor = document.getElementById("dialogEvidencias");
    evidenciasActuales = normalizarEvidencias(evidencias);
    indiceEvidenciaActual = 0;

    if (!evidenciasActuales.length) {
        contenedor.innerHTML = '<p class="sin-evidencias-dialog">Sin fotografías</p>';
        return;
    }

    const cantidadAdicional = evidenciasActuales.length - 1;
    contenedor.innerHTML = `
        <button type="button" class="evidencia-principal" id="abrirVisorEvidencias"
            aria-label="Ver ${evidenciasActuales.length} fotografías del ticket">
            <img src="${escaparHtml(evidenciasActuales[0])}" alt="Primera evidencia del ticket">
            ${cantidadAdicional > 0 ? `<span class="cantidad-evidencias">+${cantidadAdicional}</span>` : ""}
        </button>
    `;

    document.getElementById("abrirVisorEvidencias")?.addEventListener("click", abrirGaleriaEvidencias);
}

function actualizarGaleriaEvidencias() {
    const urlActual = evidenciasActuales[indiceEvidenciaActual];
    fotoEvidenciaActual.src = urlActual;
    fotoEvidenciaActual.alt = `Evidencia ${indiceEvidenciaActual + 1} del ticket`;
    contadorEvidencias.textContent = `${indiceEvidenciaActual + 1} de ${evidenciasActuales.length}`;

    const hayVarias = evidenciasActuales.length > 1;
    evidenciaAnterior.disabled = !hayVarias;
    evidenciaSiguiente.disabled = !hayVarias;

    miniaturasEvidencias.innerHTML = evidenciasActuales.map((url, indice) => `
        <button type="button" class="miniatura-evidencia ${indice === indiceEvidenciaActual ? "activa" : ""}"
            data-indice-evidencia="${indice}" aria-label="Ver evidencia ${indice + 1}">
            <img src="${escaparHtml(url)}" alt="">
        </button>
    `).join("");
}

function abrirGaleriaEvidencias() {
    if (!evidenciasActuales.length) return;
    indiceEvidenciaActual = 0;
    actualizarGaleriaEvidencias();
    visorEvidencias.showModal();
}

function cambiarEvidencia(direccion) {
    if (evidenciasActuales.length < 2) return;
    indiceEvidenciaActual = (
        indiceEvidenciaActual + direccion + evidenciasActuales.length
    ) % evidenciasActuales.length;
    actualizarGaleriaEvidencias();
}

function renderizarOpciones(select, elementos, propiedadId, propiedadNombre, textoInicial) {
    select.innerHTML = `<option value="">${escaparHtml(textoInicial)}</option>`;
    elementos.forEach((elemento) => {
        const opcion = document.createElement("option");
        opcion.value = elemento[propiedadId];
        opcion.textContent = elemento[propiedadNombre];
        select.appendChild(opcion);
    });
}

async function asegurarDepartamentos() {
    if (!departamentosDisponibles.length) {
        departamentosDisponibles = await getDepartamentosAsignables();
    }
    renderizarOpciones(
        sltDepartamentoDialog,
        departamentosDisponibles,
        "idDepartamento",
        "nombreDepartamento",
        "Selecciona un departamento"
    );
}

async function cargarTecnicos(idDepartamento, tecnicoSeleccionado = null) {
    sltTecnico.disabled = true;
    sltTecnico.innerHTML = '<option value="">Cargando técnicos...</option>';
    try {
        const tecnicos = await getTecnicosPorDepartamento(idDepartamento);
        renderizarOpciones(
            sltTecnico,
            tecnicos || [],
            "idUsuario",
            "correo",
            "Selecciona un técnico"
        );
        if (tecnicoSeleccionado) sltTecnico.value = String(tecnicoSeleccionado);
    } finally {
        sltTecnico.disabled = false;
    }
}

function limitarFechasPasadas() {
    const ahora = new Date();
    const fechaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    fechaVencimiento.min = fechaLocal;
}

function llenarDialog(ticket) {
    document.getElementById("dialogIdTicket").value = ticket.idTicket;
    document.getElementById("dialogAsunto").textContent = ticket.asunto || "Sin asunto";
    document.getElementById("dialogCodigo").textContent = ticket.codigo || "";
    document.getElementById("dialogEstado").textContent = ticket.estado || "-";
    document.getElementById("dialogTecnicoActual").textContent = ticket.nombreTecnico || "Sin asignar";
    document.getElementById("dialogTipo").textContent = ticket.tipoTicket || "-";
    document.getElementById("dialogUbicacion").textContent = ticket.ubicacion || "-";
    document.getElementById("dialogDescripcion").textContent = ticket.descripcion || "Sin descripción";
    sltPrioridad.value = ticket.prioridad || "";
    fechaVencimiento.value = formatearParaDateTimeLocal(ticket.fechaVencimiento);
    renderizarEvidencias(ticket.evidencias);
}

async function abrirDialog(idTicket) {
    if (
        !idTicket
        || dialogAprobacion.open
        || dialogDepartamento.open
        || dialogAprobacion.classList.contains("cerrando")
        || dialogDepartamento.classList.contains("cerrando")
    ) return;

    idTicketSeleccionado = idTicket;
    formAprobacion.setAttribute("aria-busy", "true");
    limitarFechasPasadas();

    try {
        const ticket = await getTicket(idTicket);
        departamentoTicketActual = Number(ticket.departamento);

        await cargarTecnicos(departamentoTicketActual, ticket.tecnicoAsignado);

        llenarDialog(ticket);
        dialogAprobacion.classList.remove("cerrando");
        bloquearScrollGestion();
        dialogAprobacion.showModal();
    } catch (error) {
        console.error("Error al cargar el detalle del ticket:", error);
        idTicketSeleccionado = null;
        mostrarError(error.message || "No se pudo cargar el ticket.");
    } finally {
        formAprobacion.removeAttribute("aria-busy");
    }
}

function detenerEventoDialog(evento) {
    evento?.preventDefault();
    evento?.stopPropagation();
}

function bloquearScrollGestion() {
    if (document.documentElement.classList.contains("dialog-gestion-abierto")) return;

    posicionScrollBloqueada = window.scrollY;
    estilosBodyAntesDelDialog = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
        width: document.body.style.width
    };

    document.documentElement.classList.add("dialog-gestion-abierto");
    document.body.style.position = "fixed";
    document.body.style.top = `-${posicionScrollBloqueada}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
}

function liberarScrollGestion() {
    if (!document.documentElement.classList.contains("dialog-gestion-abierto")) return;

    document.documentElement.classList.remove("dialog-gestion-abierto");
    if (estilosBodyAntesDelDialog) {
        Object.assign(document.body.style, estilosBodyAntesDelDialog);
    }
    window.scrollTo(0, posicionScrollBloqueada);
    estilosBodyAntesDelDialog = null;
}

function animarCierreDialog(dialog) {
    if (!dialog.open || dialog.classList.contains("cerrando")) {
        return Promise.resolve(false);
    }

    const tarjeta = dialog.querySelector(".detalle-aprobacion, .detalle-departamento");
    dialog.classList.add("cerrando");

    return new Promise((resolver) => {
        let finalizado = false;
        let animacion;

        const finalizar = () => {
            if (finalizado) return;
            finalizado = true;
            if (dialog.open) dialog.close();
            animacion?.cancel();
            dialog.classList.remove("cerrando");
            resolver(true);
        };

        if (tarjeta?.animate) {
            tarjeta.getAnimations().forEach((actual) => actual.cancel());
            animacion = tarjeta.animate([
                { opacity: 1, transform: "translateY(0) scale(1)" },
                { opacity: 0.88, transform: "translateY(5px) scale(.985)", offset: 0.45 },
                { opacity: 0, transform: "translateY(20px) scale(.94)" }
            ], {
                duration: DURACION_CIERRE_DIALOGO,
                easing: "cubic-bezier(.32, 0, .2, 1)",
                fill: "forwards"
            });
            animacion.finished.then(finalizar, finalizar);
            window.setTimeout(finalizar, DURACION_CIERRE_DIALOGO + 100);
            return;
        }

        window.setTimeout(finalizar, DURACION_CIERRE_DIALOGO);
    });
}

async function cerrarDialogConAnimacion(evento) {
    detenerEventoDialog(evento);
    if (!dialogAprobacion.open || dialogAprobacion.classList.contains("cerrando")) return;
    await animarCierreDialog(dialogAprobacion);
    limpiarTicketSeleccionado();
    liberarScrollGestion();
}

function limpiarTicketSeleccionado() {
    idTicketSeleccionado = null;
    departamentoTicketActual = null;
    formAprobacion.reset();
    formDepartamento.reset();
}

async function volverADialogAprobacion(evento) {
    detenerEventoDialog(evento);
    if (dialogDepartamento.open) await animarCierreDialog(dialogDepartamento);
    if (idTicketSeleccionado && !dialogAprobacion.open) {
        dialogAprobacion.classList.remove("cerrando");
        dialogAprobacion.showModal();
    }
}

async function cerrarFlujoGestion(evento) {
    detenerEventoDialog(evento);

    if (dialogDepartamento.open && !dialogDepartamento.classList.contains("cerrando")) {
        await animarCierreDialog(dialogDepartamento);
        limpiarTicketSeleccionado();
        liberarScrollGestion();
        return;
    }

    if (dialogAprobacion.open) {
        cerrarDialogConAnimacion();
        return;
    }

    limpiarTicketSeleccionado();
    liberarScrollGestion();
}

async function mostrarCambioDepartamento() {
    if (cargandoAccion || !idTicketSeleccionado) return;

    abrirCambioDepartamento.disabled = true;
    try {
        await asegurarDepartamentos();
        const opcionActual = sltDepartamentoDialog.querySelector(
            `option[value="${departamentoTicketActual}"]`
        );
        if (opcionActual) {
            opcionActual.disabled = true;
            opcionActual.textContent = `${opcionActual.textContent} (actual)`;
        }
        sltDepartamentoDialog.value = "";
        await animarCierreDialog(dialogAprobacion);
        dialogDepartamento.classList.remove("cerrando");
        dialogDepartamento.showModal();
    } catch (error) {
        mostrarError(error.message || "No se pudieron cargar los departamentos.");
    } finally {
        abrirCambioDepartamento.disabled = false;
    }
}

function establecerAccionEnCurso(enCurso) {
    cargandoAccion = enCurso;
    formAprobacion.querySelectorAll("button, select, input").forEach((control) => {
        control.disabled = enCurso;
    });
    cerrarDialog.disabled = enCurso;
    formDepartamento.querySelectorAll("button, select").forEach((control) => {
        control.disabled = enCurso;
    });
    cerrarDialogDepartamento.disabled = enCurso;
}

ticketsPendientes.addEventListener("click", (evento) => {
    const tarjeta = evento.target.closest(".ticket-gestion-pendiente");
    if (!tarjeta || !ticketsPendientes.contains(tarjeta)) return;
    abrirDialog(Number(tarjeta.dataset.idTicket));
});

const buscarGestion = document.getElementById("buscarGestion");
const prioridadGestion = document.getElementById("prioridadGestion");
const panelPrioridadGestion = document.getElementById("panelPrioridadGestion");
const estadoGestion = document.getElementById("estadoGestion");
const panelEstadoGestion = document.getElementById("panelEstadoGestion");
const inputFechaGestion = document.getElementById("inputFechaGestion");
let esperaBusqueda;
function aplicarFiltrosTodos() {
    clearTimeout(esperaBusqueda);
    filtrosTodos.busqueda = buscarGestion.value.trim();
    cargarTodos(1);
}
buscarGestion.addEventListener("input", () => {
    clearTimeout(esperaBusqueda);
    esperaBusqueda = setTimeout(aplicarFiltrosTodos, 350);
});
function cerrarPrioridad() {
    panelPrioridadGestion.classList.remove("abierto");
    prioridadGestion.setAttribute("aria-expanded", "false");
    panelEstadoGestion.classList.remove("abierto");
    estadoGestion.setAttribute("aria-expanded", "false");
}
prioridadGestion.addEventListener("click", (evento) => {
    evento.stopPropagation();
    document.getElementById("selectorInterfaz")?._cerrarSelector?.();
    const abierto = !panelPrioridadGestion.classList.contains("abierto");
    cerrarPrioridad();
    panelPrioridadGestion.classList.toggle("abierto", abierto);
    prioridadGestion.setAttribute("aria-expanded", String(abierto));
});
panelPrioridadGestion.querySelectorAll(".filter-opcion").forEach(opcion => {
    opcion.addEventListener("click", () => {
        filtrosTodos.prioridad = opcion.dataset.valor;
        prioridadGestion.querySelector(".filter-text").textContent = opcion.dataset.valor ? opcion.textContent : "Prioridad";
        panelPrioridadGestion.querySelectorAll(".filter-opcion").forEach(item => item.classList.toggle("seleccionada", item === opcion));
        cerrarPrioridad();
        aplicarFiltrosTodos();
    });
});
estadoGestion.addEventListener("click", (evento) => {
    evento.stopPropagation();
    document.getElementById("selectorInterfaz")?._cerrarSelector?.();
    const abierto = !panelEstadoGestion.classList.contains("abierto");
    cerrarPrioridad();
    panelEstadoGestion.classList.toggle("abierto", abierto);
    estadoGestion.setAttribute("aria-expanded", String(abierto));
});
panelEstadoGestion.querySelectorAll(".filter-opcion").forEach(opcion => {
    opcion.addEventListener("click", () => {
        filtrosTodos.estado = opcion.dataset.valor;
        estadoGestion.querySelector(".filter-text").textContent = opcion.dataset.valor || "Estado";
        panelEstadoGestion.querySelectorAll(".filter-opcion").forEach(item => item.classList.toggle("seleccionada", item === opcion));
        cerrarPrioridad();
        aplicarFiltrosTodos();
    });
});
document.addEventListener("click", cerrarPrioridad);
document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") cerrarPrioridad();
});
document.getElementById("fechaGestion").addEventListener("click", () => {
    cerrarPrioridad();
    if (typeof inputFechaGestion.showPicker === "function") inputFechaGestion.showPicker();
    else { inputFechaGestion.focus(); inputFechaGestion.click(); }
});
inputFechaGestion.addEventListener("change", () => {
    filtrosTodos.fecha = inputFechaGestion.value;
    document.querySelector("#fechaGestion .filter-text").textContent = inputFechaGestion.value || "Fecha";
    aplicarFiltrosTodos();
});

formAprobacion.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (cargandoAccion || !idTicketSeleccionado) return;

    if (!formAprobacion.checkValidity()) {
        formAprobacion.reportValidity();
        return;
    }

    if (new Date(fechaVencimiento.value).getTime() < Date.now()) {
        mostrarError("La fecha de vencimiento debe ser posterior a la fecha actual.");
        return;
    }

    // Cierra el dialog antes de confirmar: mientras el dialog nativo esta abierto
    // (showModal), todo lo que queda fuera de el se vuelve inerte, y la alerta de
    // confirmacion (que se agrega al body) no se puede ver ni tocar.
    dialogAprobacion.close();
    const confirmar = await mostrarConfirmacion(
        "¿Aprobar este ticket?",
        "Se asignará al técnico seleccionado con la prioridad y fecha indicadas.",
        "Aprobar"
    );
    if (!confirmar) {
        dialogAprobacion.classList.remove("cerrando");
        dialogAprobacion.showModal();
        return;
    }

    establecerAccionEnCurso(true);
    try {
        await asignarTicket(idTicketSeleccionado, idUsuario, {
            prioridad: sltPrioridad.value,
            tecnicoAsignado: Number(sltTecnico.value),
            fechaVencimiento: fechaVencimiento.value
        });
        mostrarExitoSimple("Ticket aprobado", "El ticket fue asignado correctamente.");
        limpiarTicketSeleccionado();
        liberarScrollGestion();
        await recargarGestionTickets();
    } catch (error) {
        mostrarError(error.message || "No se pudo aprobar el ticket.").then(() => {
            dialogAprobacion.classList.remove("cerrando");
            dialogAprobacion.showModal();
        });
    } finally {
        establecerAccionEnCurso(false);
    }
});

formDepartamento.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (cargandoAccion || !idTicketSeleccionado) return;

    const nuevoDepartamento = Number(sltDepartamentoDialog.value);
    if (!nuevoDepartamento) {
        mostrarError("Selecciona el departamento al que enviarás el ticket.");
        sltDepartamentoDialog.focus();
        return;
    }
    if (nuevoDepartamento === departamentoTicketActual) {
        mostrarError("Selecciona un departamento diferente al actual.");
        sltDepartamentoDialog.focus();
        return;
    }

    // Cierra el dialog antes de confirmar (ver nota en formAprobacion).
    dialogDepartamento.close();
    const confirmar = await mostrarConfirmacion(
        "¿Enviar a otro departamento?",
        "Tu departamento dejará de gestionar este ticket.",
        "Reasignar"
    );
    if (!confirmar) {
        dialogDepartamento.classList.remove("cerrando");
        dialogDepartamento.showModal();
        return;
    }

    establecerAccionEnCurso(true);
    try {
        await actualizarDepartamento(idTicketSeleccionado, { departamento: nuevoDepartamento }, idUsuario);
        mostrarExitoSimple("Ticket reasignado", "El ticket fue enviado al nuevo departamento.");
        limpiarTicketSeleccionado();
        liberarScrollGestion();
        await recargarGestionTickets();
    } catch (error) {
        mostrarError(error.message || "No se pudo reasignar el ticket.").then(() => {
            dialogDepartamento.classList.remove("cerrando");
            dialogDepartamento.showModal();
        });
    } finally {
        establecerAccionEnCurso(false);
    }
});

cerrarDialog.addEventListener("click", cerrarDialogConAnimacion);
abrirCambioDepartamento.addEventListener("click", mostrarCambioDepartamento);
eliminarTicketAprobacion.addEventListener("click", async () => {
    if (cargandoAccion || !idTicketSeleccionado) return;

    const idAEliminar = idTicketSeleccionado;

    dialogAprobacion.close();
    const confirmar = await mostrarConfirmacion(
        "¿Eliminar este ticket?",
        "Esta acción no se puede revertir.",
        "Eliminar"
    );
    if (!confirmar) {
        dialogAprobacion.classList.remove("cerrando");
        dialogAprobacion.showModal();
        return;
    }

    establecerAccionEnCurso(true);
    try {
        await eliminarTicket(idAEliminar, idUsuario);
        mostrarExitoSimple("Ticket eliminado", "El ticket fue eliminado correctamente.");
        limpiarTicketSeleccionado();
        liberarScrollGestion();
        await recargarGestionTickets();
    } catch (error) {
        mostrarError(error.message || "No se pudo eliminar el ticket.").then(() => {
            dialogAprobacion.classList.remove("cerrando");
            dialogAprobacion.showModal();
        });
    } finally {
        establecerAccionEnCurso(false);
    }
});
cerrarDialogDepartamento.addEventListener("click", cerrarFlujoGestion);
cancelarCambioDepartamento.addEventListener("click", volverADialogAprobacion);
dialogAprobacion.addEventListener("click", (evento) => {
    if (evento.target === dialogAprobacion) cerrarDialogConAnimacion();
});
dialogAprobacion.addEventListener("cancel", (evento) => {
    evento.preventDefault();
    cerrarDialogConAnimacion();
});
dialogDepartamento.addEventListener("click", (evento) => {
    if (evento.target === dialogDepartamento) cerrarFlujoGestion(evento);
});
dialogDepartamento.addEventListener("cancel", (evento) => {
    cerrarFlujoGestion(evento);
});

evidenciaAnterior.addEventListener("click", () => cambiarEvidencia(-1));
evidenciaSiguiente.addEventListener("click", () => cambiarEvidencia(1));
cerrarVisorEvidencias.addEventListener("click", () => visorEvidencias.close());
visorEvidencias.addEventListener("click", (evento) => {
    if (evento.target === visorEvidencias) visorEvidencias.close();
});
miniaturasEvidencias.addEventListener("click", (evento) => {
    const miniatura = evento.target.closest("[data-indice-evidencia]");
    if (!miniatura) return;
    indiceEvidenciaActual = Number(miniatura.dataset.indiceEvidencia);
    actualizarGaleriaEvidencias();
});

document.addEventListener("DOMContentLoaded", () => {
    if (idUsuario) recargarGestionTickets();
});

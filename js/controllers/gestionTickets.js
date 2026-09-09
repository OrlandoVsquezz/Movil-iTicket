import {
    asignarTicket,
    actualizarDepartamento,
    getAprobacionesPendientes,
    getTicket,
    getTicketsPorDepartamento
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

const LIMITE_PENDIENTES = 5;
const TAMANO_PAGINA_API = 50;

const ticketsPendientes = document.getElementById("ticketsPendientes");
const todosTickets = document.getElementById("todosTickets");
const dialogAprobacion = document.getElementById("dialogAprobacion");
const cerrarDialog = document.getElementById("cerrarDialog");
const formAprobacion = document.getElementById("formAprobacion");
const cancelarAprobacion = document.getElementById("cancelarAprobacion");
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
    const prioridad = clasePrioridad(ticket.prioridad);
    const claseIcono = claseIconoPrioridad(ticket.prioridad);
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
                    <img src="img/Mensaje.png" alt="Abrir ticket" class="chat-icon">
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
    if (!tickets?.length) {
        mostrarMensaje(ticketsPendientes, "No hay aprobaciones pendientes.");
        return;
    }

    ticketsPendientes.innerHTML = tickets.map((ticket) => plantillaTicket(ticket, true)).join("");
}

function renderizarTodos(tickets) {
    if (!tickets?.length) {
        mostrarMensaje(todosTickets, "No hay tickets para mostrar.");
        return;
    }

    todosTickets.innerHTML = tickets.map((ticket) => plantillaTicket(ticket)).join("");
}

async function obtenerTodosLosTickets() {
    const primeraPagina = await getTicketsPorDepartamento(idUsuario, 1, TAMANO_PAGINA_API);
    const tickets = [...(primeraPagina?.tickets || [])];
    const totalPaginas = Number(primeraPagina?.totalPaginas) || 1;

    if (totalPaginas <= 1) return tickets;

    const solicitudes = [];
    for (let pagina = 2; pagina <= totalPaginas; pagina += 1) {
        solicitudes.push(getTicketsPorDepartamento(idUsuario, pagina, TAMANO_PAGINA_API));
    }

    const paginas = await Promise.all(solicitudes);
    paginas.forEach((resultado) => tickets.push(...(resultado?.tickets || [])));
    return tickets;
}

async function recargarGestionTickets() {
    mostrarMensaje(ticketsPendientes, "Cargando aprobaciones...");
    mostrarMensaje(todosTickets, "Cargando tickets...");

    const [resultadoPendientes, resultadoTodos] = await Promise.allSettled([
        getAprobacionesPendientes(LIMITE_PENDIENTES, idUsuario),
        obtenerTodosLosTickets()
    ]);

    if (resultadoPendientes.status === "fulfilled") {
        renderizarPendientes(resultadoPendientes.value || []);
    } else {
        mostrarMensaje(ticketsPendientes, "No se pudieron cargar las aprobaciones.");
        console.error("Error al cargar aprobaciones pendientes:", resultadoPendientes.reason);
    }

    if (resultadoTodos.status === "fulfilled") {
        renderizarTodos(resultadoTodos.value || []);
    } else {
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

todosTickets.addEventListener("click", (evento) => {
    const tarjeta = evento.target.closest(".ticket-card");
    if (!tarjeta || !todosTickets.contains(tarjeta)) return;
    window.location.href = tarjeta.dataset.url;
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

    const confirmar = await mostrarConfirmacion(
        "¿Aprobar este ticket?",
        "Se asignará al técnico seleccionado con la prioridad y fecha indicadas.",
        "Aprobar"
    );
    if (!confirmar) return;

    establecerAccionEnCurso(true);
    try {
        await asignarTicket(idTicketSeleccionado, idUsuario, {
            prioridad: sltPrioridad.value,
            tecnicoAsignado: Number(sltTecnico.value),
            fechaVencimiento: fechaVencimiento.value
        });
        mostrarExitoSimple("Ticket aprobado", "El ticket fue asignado correctamente.");
        await cerrarDialogConAnimacion();
        await recargarGestionTickets();
    } catch (error) {
        mostrarError(error.message || "No se pudo aprobar el ticket.");
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

    const confirmar = await mostrarConfirmacion(
        "¿Enviar a otro departamento?",
        "Tu departamento dejará de gestionar este ticket.",
        "Reasignar"
    );
    if (!confirmar) return;

    establecerAccionEnCurso(true);
    try {
        await actualizarDepartamento(idTicketSeleccionado, { departamento: nuevoDepartamento });
        mostrarExitoSimple("Ticket reasignado", "El ticket fue enviado al nuevo departamento.");
        await animarCierreDialog(dialogDepartamento);
        limpiarTicketSeleccionado();
        liberarScrollGestion();
        await recargarGestionTickets();
    } catch (error) {
        mostrarError(error.message || "No se pudo reasignar el ticket.");
    } finally {
        establecerAccionEnCurso(false);
    }
});

cerrarDialog.addEventListener("click", cerrarDialogConAnimacion);
cancelarAprobacion.addEventListener("click", cerrarDialogConAnimacion);
abrirCambioDepartamento.addEventListener("click", mostrarCambioDepartamento);
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

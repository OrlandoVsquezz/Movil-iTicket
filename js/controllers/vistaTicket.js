import { getTicket, editarComoCreador, editarComoGestor, editarEstadoAsignado, reportarTicket } from "../services/ticketsService.js";
import { obtenerEvidenciasPorTicket, eliminarEvidencia, subirEvidencia } from "../services/evidenciasService.js";
import { getDepartamentosAsignables } from "../services/departamentosService.js";
import { getUbicaciones } from "../services/ubicacionesService.js";
import { buscarArticulosPorCodigoParcial } from "../services/articulosService.js";
import { getTecnicosPorDepartamento } from "../services/usuariosService.js";
import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/sweetAlerts.js";
import { validarFormularioTicket, validarFormularioAprobacion, validarFormularioReporte } from "../validators/ticketsValidator.js";
import { obtenerPermisos } from "../validators/permisosTicket.js";
import { getBitacorasPorTicket } from "../services/bitacorasService.js";
import { crearComentario, obtenerComentariosPorTicket, eliminarComentario } from "../services/comentariosService.js";
import { subirMultimediaComentario } from "../services/multimediaComentariosService.js";
import { formatearFecha24H, formatearFecha12H, formatearParaDateTimeLocal } from "../utils/formateadores.js";
import { validarFormularioComentario } from "../validators/comentariosValidator.js";

const CATEGORIA_POR_TIPO = { "Articulo": "equipos", "General": "general", "Software": "software" };
const limiteEvidenciasTicket = 5;
const limiteMultimediaComentario = 3;

const btnVolver = document.getElementById("btnVolver");
const targetaTicket = document.getElementById("targetaTicket");
const galeriaEvidenciasVista = document.getElementById("galeriaEvidenciasVista");

const tablaBitacora = document.getElementById("tablaBitacora");

let idTicketActual = null;
let ticketActual = null;
let evidenciasActuales = [];
let archivosNuevosEvidencia = [];
let listaCodigosEquipos = [];
let listaSoftwareVersion = [];
let departamentosCargados = false;
let listaDepartamentosDisponibles = [];
let ubicacionesCargadas = false;
let temporizadorBusqueda = null;
let comentariosActuales = [];
let archivosComentarioSeleccionados = [];

const idUsuario = 1//Temporal
const rol = "administrador"

document.addEventListener("DOMContentLoaded", () => {
    if (btnVolver) {
        btnVolver.addEventListener("click", function (e) {
            if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
                e.preventDefault();
                window.history.back();
            }
        });
    }

    idTicketActual = obtenerIdTicketDesdeURL();
    if (!idTicketActual) {
        mostrarError("No se especificó el ticket a mostrar.");
        return;
    }

    cargarTicket();
    cargarBitacoras();
});

function obtenerIdTicketDesdeURL() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get("id");
}

async function cargarTicket() {
    try {
        const [ticket, evidencias, comentarios] = await Promise.all([
            getTicket(idTicketActual),
            obtenerEvidenciasPorTicket(idTicketActual),
            obtenerComentariosPorTicket(idTicketActual)
        ]);

        ticketActual = ticket;
        evidenciasActuales = evidencias || [];
        comentariosActuales = comentarios || [];

        renderizarVista();
        configurarPermisos();
        renderizarReporte();
        renderizarComentarios();
    } catch (error) {
        console.error("Error al cargar el ticket:", error);
        mostrarError("No se pudo cargar la información del ticket.");
    }
}

function renderizarVista() {
    const t = ticketActual;
    const prio = t.prioridad || '';

    let software = "";
    let articulos = "";

    if (t.tipoTicket === "Articulo" && t.codigosArticulos?.length) {
        articulos = t.codigosArticulos.join(", ");
    }
    if (t.tipoTicket === "Software" && t.detallesSoftware?.length) {
        software = t.detallesSoftware.map((sw) => `${sw.nombreSoftware} (v.${sw.version})`).join(", ");
    }

    targetaTicket.innerHTML = `
        <header class="ticket-header">
            <div class="ticket-title-group">
                <i class="bi bi-ticket-perforated bi-${prio} me-2"></i>
                <span class="dot">•</span>
                <h2 class="ticket-title texto-limitado">${t.asunto}</h2>
            </div>
            <div class="header-actions">
                <span class="badge prioridad-${prio}">${prio}</span>
            </div>
        </header>
        <div class="mb-2">
            <div class="ticket-details">
                <p class="ticket-code">${t.codigo}</p>
                <p class="ticket-info"><strong>Estado:</strong> ${t.estado}</p>
                <p class="ticket-info"><strong>Creado:</strong> ${formatearFecha12H(t.fechaCreacion)}</p>
                ${t.fechaVencimiento ? `<p class="ticket-info"><strong>Vence:</strong> ${formatearFecha12H(t.fechaVencimiento)}</p> ` : ''}
                ${t.correoTecnico ? `<p class="ticket-info"><strong>Técnico asignado:</strong> ${t. nombreTecnico}</p> ` : ''}
            </div>

            <div class="ticket-description mb-2">
                <p class="description-title">Descripción:</p>
                <p class="description-text">${t.descripcion}</p>
            </div>
            <div class="ticket-details">
                <p class="ticket-info"><strong>Ubicación:</strong> ${t.ubicacion}</p>
                ${software ? `<p class="ticket-info"><strong>Software a instalar:</strong> ${software}</p> ` : ''}
                ${articulos ? `<p class="ticket-info"><strong>Artículos:</strong> ${articulos}</p> ` : ''}
            </div>
        </div>
    `;
    renderizarGaleriaVista();
}

function renderizarGaleriaVista() {
    galeriaEvidenciasVista.innerHTML = "";

    if (evidenciasActuales.length === 0) {
        galeriaEvidenciasVista.classList.remove("contenedor-evidencias");
        galeriaEvidenciasVista.classList.add("contenedor-evidencias-null");
        galeriaEvidenciasVista.innerHTML = `<p class="text-muted small mb-0">Sin evidencias adjuntas.</p>`;
        return;
    }
    galeriaEvidenciasVista.classList.add("contenedor-evidencias");

    evidenciasActuales.forEach((evidencia) => {
        galeriaEvidenciasVista.insertAdjacentHTML("beforeend", `
            <div class="tarjeta-foto-evidencia overflow-hidden rounded-3" onclick="abrirVistaImagen('${evidencia.evidenciaUrl}')">
                <img src="${evidencia.evidenciaUrl}" alt="Evidencia" class="img-fluid object-fit-cover w-100 h-100" />
            </div>
        `);
    });
}

//Cargar y mostrar bitácoras
async function cargarBitacoras() {
    try{
        const bitacoras = await getBitacorasPorTicket(idTicketActual);

        tablaBitacora.innerHTML = "";

        bitacoras.forEach((bitacora) => {
            tablaBitacora.innerHTML += `
            <tr>
                <td class="fw-bold text-muted">${bitacora.nombreUsuario}</td>
                <td class="text-muted">${bitacora.nuevoEstado}</td>
                <td class="text-muted">${formatearFecha12H(bitacora.fechaHora)}</td>
            </tr>
            `
        });
    }catch (error) {
        console.error("Error al cargar la tabla de bitácoras:", error);
        mostrarError("Oops... No se pudo cargar la bitácora");
    }
}
import { getTicket, getTicketsPendientesEvaluacion } from "../services/ticketsService.js";
import { obtenerEvidenciasPorTicket } from "../services/evidenciasService.js";
import { crearEvaluacion } from "../services/evaluacionPendienteServices.js";
import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";
import { formatearFecha12H } from "../utils/formateadores.js";
import { obtenerIdUsuario } from "../utils/sesion.js";

const subtituloInfo = document.getElementById("subtituloInfo");
const textoInfo = document.getElementById("textoInfo");
const targetaTicket = document.getElementById("targetaTicket");
const galeriaEvidenciasVista = document.getElementById("galeriaEvidenciasVista");
const formularioEvaluacion = document.getElementById("formEvaluacion");
const txtComentario = document.getElementById("txtComentario");
const btnEnviarEvaluacion = document.getElementById("btnEnviarEvaluacion");

const contenedorEstrellas = document.getElementById("estrellasCalificacion");
const opcionesCalificacion = Array.from(
    contenedorEstrellas.querySelectorAll('input[name="calificacion"]')
);
const resultadoCalificacion = document.getElementById("resultadoCalificacion");

let idTicketActual = null;
let ticketActual = null;
let evidenciasActuales = [];
let calificacionSeleccionada = 0;

function obtenerIdUsuarioDesdeURL() {
    return obtenerIdUsuario();
}

/* Aqui se agarra el parametro id de la URL  */
function obtenerIdTicketDesdeURL() {
    const parametros = new URLSearchParams(window.location.search);
    const idTicket = Number(parametros.get("id"));
    return Number.isInteger(idTicket) && idTicket > 0 ? idTicket : null;
}

document.addEventListener("DOMContentLoaded", iniciarPantalla);

// Configuracion general de las funciones que van a hacer que la interfaz funcione
async function iniciarPantalla() {
    configurarEstrellas();
    configurarFormulario();
    pintarEstrellas(0);
    prepararImagenSeleccionada();

    idTicketActual = obtenerIdTicketDesdeURL();
    mostrarCargaTicket();

    try {
        if (idTicketActual) {
            // Si la url trae el id, se agarra toda la info del ticket
            await cargarTicketPorId();
        } else {
            // Sino se carga el primer ticket que tenga estado Resuelto
            await cargarPrimerTicketPendiente();
        }

        validarTicketEvaluable();
        renderizarVista();
        renderizarGaleriaVista();
        renderizarInformacionEvaluacion();
        
        // Por si no se alcanza a cargar ninguna evaluacion (problema interno)
    } catch (error) {
        console.error("Error al cargar la evaluación pendiente:", error);
        bloquearFormulario();
        targetaTicket.innerHTML = '<p class="texto">No se pudo cargar el ticket pendiente.</p>';
        mostrarError(error.message || "No se pudo cargar la información del ticket.");
    }
}

/* Si la URL incluye un id, ticket y evidencias se piden de un solo */
async function cargarTicketPorId() {
    ticketActual = await getTicket(idTicketActual);
    if (Number(ticketActual?.creador) !== Number(obtenerIdUsuario())) {
        throw new Error("Solo puedes evaluar tus propios tickets.");
    }

    evidenciasActuales = await obtenerEvidenciasPorTicket(idTicketActual) || [];
}

// Si no viene ninguno con el id, se agarra el primer ticket resuelto del usuario
async function cargarPrimerTicketPendiente() {
    const resultado = await getTicketsPendientesEvaluacion(obtenerIdUsuarioDesdeURL());
    const tickets = Array.isArray(resultado) ? resultado : resultado?.tickets || [];

    // Si no hay nada pendiente por evaluar devuelve un error (cosa que no deberia pasar porque el boton de evaluaciones del inicio NO deberia aparecer)
    if (tickets.length === 0) {
        throw new Error("No tienes tickets pendientes de evaluación.");
    }

    idTicketActual = Number(tickets[0].idTicket);
    await cargarTicketPorId();

    /* Guarda el id en la URL */
    const url = new URL(window.location.href);
    url.searchParams.set("id", idTicketActual);
    window.history.replaceState({}, "", url);
}

// Si el ticket no eciste no se puede evaluar, si no esta en estado resuelto no esta listo para ser evaluado
function validarTicketEvaluable() {
    if (!ticketActual) throw new Error("El ticket solicitado no existe.");
    if (Number(ticketActual.creador) !== Number(obtenerIdUsuario())) {
        throw new Error("Solo puedes evaluar tus propios tickets.");
    }
    if (ticketActual.estado !== "Resuelto") {
        throw new Error("Este ticket todavía no está listo para ser evaluado.");
    }
}

function mostrarCargaTicket() {
    targetaTicket.innerHTML = '<p class="texto">Cargando ticket...</p>';
}

// Formateador de fechas
function formatearFechaTicket(fecha) {
    if (!fecha) return "-";
    if (/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/.test(fecha)) return fecha;
    return formatearFecha12H(fecha);
}

// Reutilizado de vistaTicket
function renderizarVista() {
    const t = ticketActual;
    const prioridad = t.prioridad || "";
    const tecnico = t.nombreTecnico || t.tecnico || "Técnico asignado";

    targetaTicket.innerHTML = `
        <header class="ticket-header">
            <div class="ticket-title-group">
                <i class="bi bi-ticket-perforated bi-${prioridad} me-2"></i>
                <span class="dot">•</span>
                <h2 class="ticket-title texto-limitado">${t.asunto}</h2>
            </div>
            <div class="header-actions">
                ${prioridad ? `<span class="badge prioridad-${prioridad}">${prioridad}</span>` : ""}
            </div>
        </header>

        <div class="ticket-details">
            <p class="ticket-code">${t.codigo}</p>
            <p class="ticket-info"><strong>Estado:</strong> ${t.estado}</p>
            ${t.fechaCreacion ? `<p class="ticket-info"><strong>Creado:</strong> ${formatearFechaTicket(t.fechaCreacion)}</p>` : ""}
            <p class="ticket-info"><strong>Técnico asignado:</strong> ${tecnico}</p>
        </div>

        <div class="ticket-description">
            <p class="description-title">Descripción:</p>
            <p class="description-text">${t.descripcion}</p>
        </div>
    `;
}

// Información de seguridad (con nombre del tecnico para que sea "dinamico")
function renderizarInformacionEvaluacion() {
    const tecnico = ticketActual.nombreTecnico || ticketActual.tecnico || "tu técnico";
    subtituloInfo.textContent = `Evalúa a ${tecnico}`;
    textoInfo.textContent = `¡No te preocupes! ${tecnico} no podrá ver la evaluación; es completamente confidencial. Solo necesitamos tu opinión para mejorar.`;
}

// Vista de las evidencias
function renderizarGaleriaVista() {
    galeriaEvidenciasVista.innerHTML = "";

    if (!evidenciasActuales?.length) {
        galeriaEvidenciasVista.classList.remove("contenedor-evidencias");
        galeriaEvidenciasVista.classList.add("contenedor-evidencias-null");
        galeriaEvidenciasVista.innerHTML = '<p class="text-muted small mb-0">Sin evidencias adjuntas.</p>';
        return;
    }

    galeriaEvidenciasVista.classList.remove("contenedor-evidencias-null");
    galeriaEvidenciasVista.classList.add("contenedor-evidencias");

    evidenciasActuales.forEach(function (evidencia, indice) {
        const url = evidencia.evidenciaUrl;
        if (!url) return;

        galeriaEvidenciasVista.insertAdjacentHTML("beforeend", `
            <a class="tarjeta-foto-evidencia overflow-hidden rounded-3"
                href="${url}" target="_blank" rel="noopener"
                aria-label="Abrir evidencia ${indice + 1}">
                <img src="${url}" alt="Evidencia ${indice + 1}" class="img-fluid object-fit-cover w-100 h-100">
            </a>
        `);
    });
}

// Envia la evaluacion
function configurarFormulario() {
    formularioEvaluacion.addEventListener("submit", enviarEvaluacion);
}

// Se verifica que toda la informacion es correcta como para poder enviar la evaluacion
async function enviarEvaluacion(evento) {
    evento.preventDefault();

    // Si no hay ningun ticket se detiene por completo
    if (!idTicketActual || !ticketActual) {
        mostrarError("No hay un ticket cargado para evaluar.");
        return;
    }
    if (calificacionSeleccionada < 1 || calificacionSeleccionada > 5) {
        mostrarError("Selecciona una calificación de 1 a 5 estrellas.");
        return;
    }

    const evaluacion = {
        calificacion: calificacionSeleccionada,
        comentario: txtComentario.value.trim() || null,
        idTicket: idTicketActual
    };

    btnEnviarEvaluacion.disabled = true;
    btnEnviarEvaluacion.textContent = "Enviando...";

    try {
        await crearEvaluacion(evaluacion);
        mostrarExitoRedireccion(
            "¡Evaluación enviada!",
            "Gracias por ayudarnos a mejorar el servicio.",
            "inicio.html" // Te redirige al inicio
        );
    } catch (error) {
        mostrarError(error.message || "No se pudo registrar la evaluación.");
        btnEnviarEvaluacion.disabled = false;
        btnEnviarEvaluacion.textContent = "Enviar";
    }
}

function bloquearFormulario() {
    opcionesCalificacion.forEach((opcion) => { opcion.disabled = true; });
    txtComentario.disabled = true;
    btnEnviarEvaluacion.disabled = true;
}

/* Todo esto es de las estrellas y como se van llenando dinamicamente */
function configurarEstrellas() {
    opcionesCalificacion.forEach(function (opcion) {
        opcion.addEventListener("change", function () {
            calificacionSeleccionada = Number(opcion.value);
            pintarEstrellas(calificacionSeleccionada, true);
            resultadoCalificacion.value = `${calificacionSeleccionada} de 5 estrellas`;
        });

        opcion.closest(".estrella").addEventListener("pointerenter", function (evento) {
            if (evento.pointerType !== "touch") pintarEstrellas(Number(opcion.value));
        });
    });

    contenedorEstrellas.addEventListener("pointerleave", function () {
        pintarEstrellas(calificacionSeleccionada);
    });
}

function pintarEstrellas(valor, animar = false) {
    opcionesCalificacion.forEach(function (opcion) {
        const estrella = opcion.closest(".estrella");
        const imagen = estrella.querySelector(".imagen-estrella");
        const seleccionada = Number(opcion.value) <= valor;
        const imagenNormal = contenedorEstrellas.dataset.imagen;
        const imagenSeleccionada = contenedorEstrellas.dataset.imagenSeleccionada || imagenNormal;

        estrella.classList.toggle("seleccionada", seleccionada);
        estrella.classList.remove("animando");

        if (animar && seleccionada) {
            void estrella.offsetWidth;
            estrella.classList.add("animando");
        }
        if (imagenNormal) imagen.src = seleccionada ? imagenSeleccionada : imagenNormal;
    });
}

/* Genera una estrella amarilla usando exactamente el contorno d la imagen de la estrella en img */
async function crearEstrellaRellena(rutaImagen) {
    const imagenOriginal = new Image();
    await new Promise(function (resolver, rechazar) {
        imagenOriginal.addEventListener("load", resolver, { once: true });
        imagenOriginal.addEventListener("error", rechazar, { once: true });
        imagenOriginal.src = rutaImagen;
    });

    const canvas = document.createElement("canvas");
    const contexto = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = imagenOriginal.naturalWidth;
    canvas.height = imagenOriginal.naturalHeight;
    contexto.drawImage(imagenOriginal, 0, 0);

    const imagen = contexto.getImageData(0, 0, canvas.width, canvas.height);
    const pixeles = imagen.data;
    const total = canvas.width * canvas.height;
    const exterior = new Uint8Array(total);
    const cola = new Int32Array(total);
    let inicioCola = 0;
    let finalCola = 0;

    function agregarPixel(x, y) {
        if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
        const indice = y * canvas.width + x;
        const alfa = pixeles[indice * 4 + 3];
        if (exterior[indice] || alfa > 8) return;
        exterior[indice] = 1;
        cola[finalCola++] = indice;
    }

    for (let x = 0; x < canvas.width; x++) {
        agregarPixel(x, 0);
        agregarPixel(x, canvas.height - 1);
    }
    for (let y = 0; y < canvas.height; y++) {
        agregarPixel(0, y);
        agregarPixel(canvas.width - 1, y);
    }
    while (inicioCola < finalCola) {
        const indice = cola[inicioCola++];
        const x = indice % canvas.width;
        const y = Math.floor(indice / canvas.width);
        agregarPixel(x + 1, y);
        agregarPixel(x - 1, y);
        agregarPixel(x, y + 1);
        agregarPixel(x, y - 1);
    }

    for (let indice = 0; indice < total; indice++) {
        const posicion = indice * 4;
        const alfaOriginal = pixeles[posicion + 3];
        const esContorno = alfaOriginal > 8;
        const esInterior = !exterior[indice] && !esContorno;

        if (esContorno || esInterior) {
            pixeles[posicion] = 245;
            pixeles[posicion + 1] = 197;
            pixeles[posicion + 2] = 24;
            pixeles[posicion + 3] = esInterior ? 255 : alfaOriginal;
        } else {
            pixeles[posicion + 3] = 0;
        }
    }

    contexto.putImageData(imagen, 0, 0);
    return canvas.toDataURL("image/png");
}

async function prepararImagenSeleccionada() {
    const imagenNormal = contenedorEstrellas.dataset.imagen;
    if (!imagenNormal || contenedorEstrellas.dataset.imagenSeleccionada) return;

    try {
        contenedorEstrellas.dataset.imagenSeleccionada = await crearEstrellaRellena(imagenNormal);
        pintarEstrellas(calificacionSeleccionada);
    } catch {
    }
}

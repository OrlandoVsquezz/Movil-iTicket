import { crearEvaluacion } from "../services/evaluacionesService.js";
import { getTicketsPendientesEvaluacion } from "../services/ticketsService.js";
import {
    mostrarConfirmacion,
    mostrarError,
    mostrarExitoRedireccion,
    mostrarExitoSimple
} from "../components/notificacionesUI.js";
import { obtenerIdUsuario } from "../utils/sesion.js";

const contenidoEvaluacion = document.getElementById("contenidoEvaluacion");
const ticketEvaluacion = document.getElementById("ticketEvaluacion");
const ticketAsunto = document.getElementById("ticketAsuntoEvaluacion");
const ticketCodigo = document.getElementById("ticketCodigoEvaluacion");
const ticketEstado = document.getElementById("ticketEstadoEvaluacion");
const ticketTecnico = document.getElementById("ticketTecnicoEvaluacion");
const ticketDescripcion = document.getElementById("ticketDescripcionEvaluacion");
const ticketPrioridad = document.getElementById("ticketPrioridadEvaluacion");
const iconoTicket = document.getElementById("iconoTicketEvaluacion");
const tituloEvaluarTecnico = document.getElementById("tituloEvaluarTecnico");
const progresoEvaluaciones = document.getElementById("progresoEvaluaciones");
const formEvaluacion = document.getElementById("formEvaluacion");
const comentarioEvaluacion = document.getElementById("comentarioEvaluacion");
const btnEnviarEvaluacion = document.getElementById("btnEnviarEvaluacion");
const contenedorEstrellas = document.getElementById("estrellasCalificacion");
const opcionesCalificacion = Array.from(
    contenedorEstrellas.querySelectorAll('input[name="calificacion"]')
);
const resultadoCalificacion = document.getElementById("resultadoCalificacion");

const idUsuario = obtenerIdUsuario();
const idTicketSolicitado = Number(new URLSearchParams(window.location.search).get("id"));

let ticketsPendientes = [];
let indiceTicketActual = 0;
let calificacionSeleccionada = 0;
let enviandoEvaluacion = false;

function prioridadCanonica(prioridad) {
    const valor = String(prioridad || "").trim().toLowerCase();
    if (valor === "critica" || valor === "crítica") return "Critica";
    if (valor === "alta") return "Alta";
    if (valor === "media") return "Media";
    if (valor === "baja") return "Baja";
    return "";
}

function claseIconoPrioridad(prioridad) {
    const valor = prioridadCanonica(prioridad);
    return valor ? `icono-ticket-prioridad-${valor.toLowerCase()}` : "icono-ticket-prioridad-sin-asignar";
}

function nombrePrioridad(prioridad) {
    return prioridad === "Critica" ? "Crítica" : prioridad;
}

function reiniciarCalificacion() {
    formEvaluacion.reset();
    calificacionSeleccionada = 0;
    resultadoCalificacion.value = "Sin calificación seleccionada";
    pintarEstrellas(0);
}

function pintarTicket(ticket) {
    const prioridad = prioridadCanonica(ticket.prioridad);
    const tecnico = ticket.nombreTecnico || ticket.correoTecnico || "Sin técnico asignado";

    ticketEvaluacion.dataset.idTicket = String(ticket.idTicket);
    ticketAsunto.textContent = ticket.asunto || "Sin asunto";
    ticketCodigo.textContent = ticket.codigo || "—";
    ticketEstado.textContent = ticket.estado || "Resuelto";
    ticketTecnico.textContent = tecnico;
    ticketDescripcion.textContent = ticket.descripcion || "Sin descripción";
    tituloEvaluarTecnico.textContent = tecnico === "Sin técnico asignado"
        ? "Evalúa el servicio recibido"
        : `Evalúa a ${tecnico}`;

    Array.from(iconoTicket.classList)
        .filter((clase) => clase.startsWith("icono-ticket-prioridad-"))
        .forEach((clase) => iconoTicket.classList.remove(clase));
    iconoTicket.classList.add(claseIconoPrioridad(prioridad));

    if (prioridad) {
        ticketPrioridad.hidden = false;
        ticketPrioridad.className = `badge prioridad-evaluacion prioridad-${prioridad}`;
        ticketPrioridad.textContent = nombrePrioridad(prioridad);
    } else {
        ticketPrioridad.hidden = true;
        ticketPrioridad.className = "badge prioridad-evaluacion";
        ticketPrioridad.textContent = "";
    }

    progresoEvaluaciones.textContent = ticketsPendientes.length > 1
        ? `Evaluación ${indiceTicketActual + 1} de ${ticketsPendientes.length}`
        : "";

    reiniciarCalificacion();
    window.history.replaceState(null, "", `evaluacionPendiente.html?id=${ticket.idTicket}`);
}

async function cargarEvaluacionesPendientes() {
    if (!idUsuario) return;

    contenidoEvaluacion.setAttribute("aria-busy", "true");
    try {
        const resultado = await getTicketsPendientesEvaluacion(idUsuario);
        ticketsPendientes = Array.isArray(resultado) ? resultado : resultado?.tickets || [];

        if (!ticketsPendientes.length) {
            await mostrarExitoRedireccion(
                "Sin evaluaciones pendientes",
                "Todos tus tickets resueltos ya fueron evaluados.",
                "inicio.html"
            );
            return;
        }

        const indiceSolicitado = idTicketSolicitado
            ? ticketsPendientes.findIndex((ticket) => Number(ticket.idTicket) === idTicketSolicitado)
            : -1;
        indiceTicketActual = indiceSolicitado >= 0 ? indiceSolicitado : 0;

        if (idTicketSolicitado && indiceSolicitado < 0) {
            mostrarError("Ese ticket ya no tiene una evaluación pendiente. Se mostrará la siguiente disponible.");
        }

        pintarTicket(ticketsPendientes[indiceTicketActual]);
    } catch (error) {
        console.error("Error al cargar las evaluaciones pendientes:", error);
        mostrarError(error.message || "No se pudieron cargar tus evaluaciones pendientes.");
    } finally {
        contenidoEvaluacion.removeAttribute("aria-busy");
    }
}

function establecerEnviando(enviando) {
    enviandoEvaluacion = enviando;
    formEvaluacion.querySelectorAll("input, button").forEach((control) => {
        control.disabled = enviando;
    });
    btnEnviarEvaluacion.textContent = enviando ? "Enviando..." : "Enviar";
    if (enviando) contenidoEvaluacion.setAttribute("aria-busy", "true");
    else contenidoEvaluacion.removeAttribute("aria-busy");
}

formEvaluacion.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (enviandoEvaluacion || !ticketsPendientes.length) return;

    const ticket = ticketsPendientes[indiceTicketActual];
    const comentario = comentarioEvaluacion.value.trim();

    if (!calificacionSeleccionada) {
        mostrarError("Selecciona una calificación antes de enviar.");
        return;
    }
    if (!comentario) {
        mostrarError("Deja un comentario antes de enviar.");
        comentarioEvaluacion.focus();
        return;
    }

    const confirmar = await mostrarConfirmacion(
        "¿Enviar esta evaluación?",
        "Después de enviarla no podrás editarla ni eliminarla.",
        "Enviar"
    );
    if (!confirmar) return;

    establecerEnviando(true);
    try {
        await crearEvaluacion({
            calificacion: calificacionSeleccionada,
            comentario,
            idTicket: Number(ticket.idTicket)
        });

        ticketsPendientes.splice(indiceTicketActual, 1);
        if (!ticketsPendientes.length) {
            await mostrarExitoRedireccion(
                "¡Gracias!",
                "Has completado todas tus evaluaciones pendientes.",
                "inicio.html"
            );
            return;
        }

        if (indiceTicketActual >= ticketsPendientes.length) indiceTicketActual = 0;
        mostrarExitoSimple("Evaluación enviada", "Puedes continuar con la siguiente evaluación pendiente.");
        pintarTicket(ticketsPendientes[indiceTicketActual]);
    } catch (error) {
        mostrarError(error.message || "No se pudo enviar la evaluación. Intenta nuevamente.");
    } finally {
        establecerEnviando(false);
    }
});

async function crearEstrellaRellena(rutaImagen) {
    const imagenOriginal = new Image();
    imagenOriginal.src = rutaImagen;

    await new Promise((resolver, rechazar) => {
        imagenOriginal.addEventListener("load", resolver, { once: true });
        imagenOriginal.addEventListener("error", rechazar, { once: true });
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

    for (let x = 0; x < canvas.width; x += 1) {
        agregarPixel(x, 0);
        agregarPixel(x, canvas.height - 1);
    }
    for (let y = 0; y < canvas.height; y += 1) {
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

    for (let indice = 0; indice < total; indice += 1) {
        const posicion = indice * 4;
        const alfaOriginal = pixeles[posicion + 3];
        const perteneceAlContorno = alfaOriginal > 8;
        const perteneceAlInterior = !exterior[indice] && !perteneceAlContorno;

        if (perteneceAlContorno || perteneceAlInterior) {
            pixeles[posicion] = 245;
            pixeles[posicion + 1] = 197;
            pixeles[posicion + 2] = 24;
            pixeles[posicion + 3] = perteneceAlInterior ? 255 : alfaOriginal;
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
    } catch (error) {
        console.warn("No se pudo preparar la estrella seleccionada:", error);
    }
}

function pintarEstrellas(valor, animar = false) {
    opcionesCalificacion.forEach((opcion) => {
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

opcionesCalificacion.forEach((opcion) => {
    opcion.addEventListener("change", () => {
        calificacionSeleccionada = Number(opcion.value);
        pintarEstrellas(calificacionSeleccionada, true);
        resultadoCalificacion.value = `${calificacionSeleccionada} de 5 estrellas`;
    });

    opcion.closest(".estrella").addEventListener("pointerenter", (evento) => {
        if (evento.pointerType !== "touch") pintarEstrellas(Number(opcion.value));
    });
});

contenedorEstrellas.addEventListener("pointerleave", () => {
    pintarEstrellas(calificacionSeleccionada);
});

pintarEstrellas(0);
prepararImagenSeleccionada();
document.addEventListener("DOMContentLoaded", cargarEvaluacionesPendientes);

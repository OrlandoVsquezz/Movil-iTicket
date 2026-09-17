import { obtenerConversacionesChatbot, eliminarConversacionChatbot } from "../services/chatbotService.js";
import { obtenerIdUsuario } from "../utils/sesion.js";
import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/notificacionesUI.js";

// Debe coincidir con la misma clave usada en chatbot.js
const CLAVE_CONVERSACION_SELECCIONADA = "chatConversacionSeleccionada";

const idUsuario = obtenerIdUsuario();

document.addEventListener("DOMContentLoaded", () => {
    if (!idUsuario) return;
    cargarConversaciones();
});

async function cargarConversaciones() {
    const lista = document.getElementById("listaConversaciones");
    if (!lista) return;

    lista.innerHTML = '<p class="text-muted text-center py-4">Cargando conversaciones...</p>';

    try {
        const conversaciones = await obtenerConversacionesChatbot(idUsuario);
        pintarConversaciones(lista, Array.isArray(conversaciones) ? conversaciones : []);
    } catch (error) {
        console.error("Error al cargar conversaciones:", error);
        lista.innerHTML = '<p class="text-muted text-center py-4">No se pudieron cargar las conversaciones.</p>';
        mostrarError("No se pudieron cargar las conversaciones. Intenta nuevamente.");
    }
}

function pintarConversaciones(lista, conversaciones) {
    if (conversaciones.length === 0) {
        lista.innerHTML = '<p class="text-muted text-center py-4">Aún no tienes conversaciones guardadas.</p>';
        return;
    }

    lista.innerHTML = conversaciones.map((conversacion) => `
        <div class="notificacion conversacion-item" data-id="${conversacion.idConversacion}">
            <div class="notificacion-icono">
                <i class="bi bi-chat-left-text"></i>
            </div>
            <div class="notificacion-contenido">
                <p class="notificacion-titulo">${escaparHTML(conversacion.titulo || "Conversación")}</p>
                <p class="notificacion-mensaje">${formatearFecha(conversacion.fechaActualizacion)}</p>
            </div>
            <button type="button" class="btn-eliminar-conversacion" data-id="${conversacion.idConversacion}" aria-label="Eliminar conversación" title="Eliminar conversación">
                <i class="bi bi-trash3"></i>
            </button>
        </div>
    `).join("");

    lista.querySelectorAll(".conversacion-item").forEach((item) => {
        item.addEventListener("click", (evento) => {
            if (evento.target.closest(".btn-eliminar-conversacion")) return;
            abrirConversacion(item.dataset.id);
        });
    });

    lista.querySelectorAll(".btn-eliminar-conversacion").forEach((boton) => {
        boton.addEventListener("click", (evento) => {
            evento.stopPropagation();
            eliminarConversacion(boton.dataset.id);
        });
    });
}

function abrirConversacion(idConversacion) {
    sessionStorage.setItem(CLAVE_CONVERSACION_SELECCIONADA, idConversacion);
    window.location.href = "chatbot.html";
}

async function eliminarConversacion(idConversacion) {
    const confirmado = await mostrarConfirmacion(
        "¿Eliminar conversación?",
        "Se eliminarán todos los mensajes de esta conversación.",
        "Sí, eliminar",
        "Cancelar"
    );
    if (!confirmado) return;

    try {
        await eliminarConversacionChatbot(idUsuario, idConversacion);
        mostrarExitoSimple("Conversación eliminada", "El historial de esta conversación se eliminó correctamente.");
        cargarConversaciones();
    } catch (error) {
        console.error("Error al eliminar la conversación:", error);
        mostrarError("No se pudo eliminar la conversación.");
    }
}

document.getElementById("btnNuevaConversacion")?.addEventListener("click", () => {
    sessionStorage.removeItem(CLAVE_CONVERSACION_SELECCIONADA);
    window.location.href = "chatbot.html";
});

function formatearFecha(valor) {
    if (!valor) return "";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "";

    return new Intl.DateTimeFormat("es-SV", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    }).format(fecha);
}

function escaparHTML(valor) {
    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

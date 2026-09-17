import { API_BASE_URL } from "./apiConfig.js";

const CHATBOT_URL = `${API_BASE_URL}/chatbot`;

// Envía al backend el mensaje del usuario conectado.
export async function enviarMensajeChatbot(idUsuario, mensaje, idConversacion = null) {
    try {
        const respuesta = await fetch(`${CHATBOT_URL}/mensaje`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idUsuario, idConversacion, mensaje })
        });

        const cuerpo = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
            throw new Error(cuerpo?.message || "No fue posible obtener una respuesta del asistente.");
        }

        return cuerpo.data;
    } catch (error) {
        console.error("Error al consultar el chatbot:", error);
        throw error;
    }
}

// Obtiene las conversaciones más recientes del usuario.
export async function obtenerConversacionesChatbot(idUsuario) {
    try {
        const respuesta = await fetch(`${CHATBOT_URL}/conversaciones?idUsuario=${encodeURIComponent(idUsuario)}`);
        const cuerpo = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
            throw new Error(cuerpo?.message || "No se pudieron cargar las conversaciones.");
        }

        return cuerpo.data;
    } catch (error) {
        console.error("Error al obtener las conversaciones:", error);
        throw error;
    }
}

// Obtiene todos los mensajes de una conversación propia.
export async function obtenerConversacionChatbot(idUsuario, idConversacion) {
    try {
        const respuesta = await fetch(
            `${CHATBOT_URL}/conversaciones/${idConversacion}?idUsuario=${encodeURIComponent(idUsuario)}`
        );
        const cuerpo = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
            throw new Error(cuerpo?.message || "No se pudo abrir la conversación.");
        }

        return cuerpo.data;
    } catch (error) {
        console.error("Error al obtener la conversación:", error);
        throw error;
    }
}

// Elimina una conversación propia y todos sus mensajes.
export async function eliminarConversacionChatbot(idUsuario, idConversacion) {
    try {
        const respuesta = await fetch(
            `${CHATBOT_URL}/conversaciones/${idConversacion}?idUsuario=${encodeURIComponent(idUsuario)}`,
            { method: "DELETE" }
        );

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || "No se pudo eliminar la conversación.");
        }

        return true;
    } catch (error) {
        console.error("Error al eliminar la conversación:", error);
        throw error;
    }
}

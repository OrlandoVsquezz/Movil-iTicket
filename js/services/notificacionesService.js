import { API_BASE_URL } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/notificaciones`;

export async function getNotificaciones(idUsuario, pagina = 1, tamano = 10) {
    try {
        const params = new URLSearchParams({ idUsuario, pagina, tamano });
        const respuesta = await fetch(`${API_URL}?${params}`);
        if (!respuesta.ok) throw new Error("Error al obtener las notificaciones");
        const registros = await respuesta.json();
        return registros.data;
    } catch (error) {
        console.error("Error al obtener las notificaciones:", error);
        throw error;
    }
}

export async function contarNoLeidas(idUsuario) {
    try {
        const respuesta = await fetch(`${API_URL}/no-leidas/contador?idUsuario=${idUsuario}`);
        if (!respuesta.ok) throw new Error("Error al contar notificaciones no leídas");
        const registros = await respuesta.json();
        return registros.data;
    } catch (error) {
        console.error("Error al contar notificaciones no leídas:", error);
        throw error;
    }
}

export async function marcarComoLeida(id, idUsuario) {
    const respuesta = await fetch(`${API_URL}/${id}/leida?idUsuario=${idUsuario}`, { method: "PATCH" });
    if (!respuesta.ok) throw new Error("Error al marcar la notificación como leída");
    return (await respuesta.json()).data;
}

export async function marcarTodasComoLeidas(idUsuario) {
    const respuesta = await fetch(`${API_URL}/leerTodas?idUsuario=${idUsuario}`, { method: "PATCH" });
    if (!respuesta.ok) throw new Error("Error al marcar todas como leídas");
}
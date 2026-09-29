import { API_BASE_URL, manejarRespuesta, apiFetch } from "./apiConfig.js";

const API_AUTH_URL = `${API_BASE_URL}/auth`;

export async function login(correo, clave) {
    try {
        const respuesta = await apiFetch(`${API_AUTH_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, clave })
        });

        return await manejarRespuesta(respuesta);
    } catch (error) {
        console.error("Error en el login:", error);
        throw error;
    }
}

export async function obtenerSesion() {
    const respuesta = await apiFetch(`${API_AUTH_URL}/me`);
    return manejarRespuesta(respuesta);
}

export async function cerrarSesion() {
    const respuesta = await apiFetch(`${API_AUTH_URL}/logout`, { method: "POST" });
    return manejarRespuesta(respuesta);
}

import { API_BASE_URL, apiFetch } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/evaluaciones`;

// Registra la valoración de un ticket resuelto. La API cierra el ticket al guardar.
// El usuario ya no viaja en la URL, el backend lo resuelve de la cookie de sesion.
export async function crearEvaluacion(evaluacion, idUsuario) {
    try {
        const respuesta = await apiFetch(`${API_URL}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(evaluacion)
        });

        const cuerpo = await respuesta.json().catch(() => null);
        if (!respuesta.ok) {
            throw new Error(
                cuerpo?.mensaje
                || cuerpo?.message
                || cuerpo?.errores?.[0]
                || "No se pudo registrar la evaluación."
            );
        }

        return cuerpo?.data;
    } catch (error) {
        console.error("Error al registrar la evaluación:", error);
        throw error;
    }
}

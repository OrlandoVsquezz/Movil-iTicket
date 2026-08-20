import { API_BASE_URL } from "./apiConfig.js";
const API_URL = `${API_BASE_URL}/evaluaciones`;

//Crear evaluacion de ticket resueltos
export async function crearEvaluacion(evaluacion) {
    try {
        const respuesta = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(evaluacion)
        });

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || "Error al registrar la evaluación");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al registrar la evaluación: ", error);
        throw error;
    }
}

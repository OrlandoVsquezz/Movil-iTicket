import { API_BASE_URL } from "./apiConfig.js";
const API_URL = `${API_BASE_URL}/fases`;

/* Metodo para obtener la lista de fases por Proyecto */
export async function obtenerFasesPorProyecto(idProyecto) {
    try {
        const response = await fetch(`${API_URL}/proyecto/${idProyecto}`);

        // 404 -> el proyecto no tiene fases registradas todavia
        if (response.status === 404) {
            return [];
        }

        if (!response.ok) {
            throw new Error('Error al obtener las fases');
        }

        const resultado = await response.json();
        return resultado.data;
    } catch (error) {
        console.error('Error en obtenerFasesPorProyecto:', error);
        throw error;
    }
}

/* Metodo para obtener fases por su nombre */
export async function obtenerFasePorNombre(nombreFase) {
    try {
        const response = await fetch(`${API_URL}/nombreFase/${encodeURIComponent(nombreFase)}`);

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error('Error al obtener la fase');
        }

        const resultado = await response.json();
        return resultado.data;
    } catch (error) {
        console.error('Error en obtenerFasePorNombre:', error);
        throw error;
    }
}

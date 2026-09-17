import { API_BASE_URL } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/departamentos`

//Obtener los departamentos asignables a tickets. La lista es la misma para todos, no depende del usuario
export async function getDepartamentosAsignables() {
    try {
        const respuesta = await fetch(`${API_URL}/asignables`);
        if (!respuesta.ok) {
            console.error("Error al obtener los departamentos asignables");
            throw new Error("Error al obtener los departamentos asignables");
        }

        const registros = await respuesta.json();
        return registros.data;
    } catch (error) {
        console.error("Error al obtener los departamentos asignables:", error);
        throw error;
    }
} 
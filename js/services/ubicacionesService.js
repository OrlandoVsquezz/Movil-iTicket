import { API_BASE_URL, apiFetch } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/ubicaciones`;

//Obtener la lista completa de ubicaciones
export async function getUbicaciones() {
    try{
        const respuesta = await apiFetch(API_URL);
        if(!respuesta.ok){
            console.error("Error al obtener las ubicaciones");
            throw new Error("Error al obtene las ubicaciones");
        }

        const registros = await respuesta.json();
        return registros.data;
    }catch(error){
        console.error("Error al obtener las ubicaciones: ", error);
        throw error;
    }
}

//Busca ubicaciones por coincidencia parcial, ya sea por su nombre/código específico
//(ej. "62.13", "Cisco") o por el tipo de ubicación (ej. "Aula", "Laboratorio")
export async function buscarUbicacionesPorNombreParcial(fragmento) {
    try {
        const respuesta = await apiFetch(`${API_URL}/buscar?nombre=${encodeURIComponent(fragmento)}`);
        if (!respuesta.ok) {
            console.error("Error al buscar ubicaciones");
            throw new Error("Error al buscar ubicaciones");
        }

        const registros = await respuesta.json();
        return registros.data;
    } catch (error) {
        console.error("Error al buscar ubicaciones: ", error);
        throw error;
    }
}
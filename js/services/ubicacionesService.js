import { API_BASE_URL } from "./apiConfig.js";
const API_URL = `${API_BASE_URL}/ubicaciones`;

//Obtener la lista completa de ubicaciones
export async function getUbicaciones() {
    try{
        const respuesta = await fetch(API_URL);
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

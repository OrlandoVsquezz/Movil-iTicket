import { API_BASE_URL } from "./apiConfig.js";
const API_URL = `${API_BASE_URL}/bitacoras`;

export async function getBitacorasPorTicket(idTicket) {
    try{
        const respuesta = await fetch(`${API_URL}/bitacoraTicket/${idTicket}`);
        if(!respuesta.ok){
            console.error("Error al obtener las bitácoras del ticket");
            throw new Error("Error al obtener las bitácoras del ticket");
        }
        const bitacoras = await respuesta.json();
        return bitacoras.data;
    } catch (error) {
        console.error("Error al obtener la bitacora del ticket:", error);
        throw error;
    }
}

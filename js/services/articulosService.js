import { API_BASE_URL } from "./apiConfig.js";
const API_URL = `${API_BASE_URL}/articulos`;

//Buscar artícuos por coincidencia parcial de código
export async function buscarArticulosPorCodigoParcial(fragmento) {
    try{
        const respuesta = await fetch(`${API_URL}/buscar?codigo=${encodeURIComponent(fragmento)}`);
        if(!respuesta.ok){
            console.error("Error al buscar artículos");
            throw new Error("Error al buscar artículos");
        }

        const registros = await respuesta.json();
        return registros.data;
    } catch(error){
        console.error("Error al buscar artículos: ", error);
        throw error;
    }
}

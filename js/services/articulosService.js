import { API_BASE_URL, apiFetch } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/articulos`;

//Busca artículos por coincidencia parcial dentro de una ubicación específica
//(el código ya no es único en todo el sistema, solo dentro de su ubicación).
export async function buscarArticulosPorCodigoParcial(fragmento, idUbicacion) {
    try{
        const parametros = new URLSearchParams({ codigo: fragmento, idUbicacion });
        const respuesta = await apiFetch(`${API_URL}/buscar?${parametros.toString()}`);
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

export async function obtenerCodigosNoInventariados(codigos, idUbicacion) {
    const codigosUnicos = [...new Set((codigos || []).map((codigo) => String(codigo).trim()).filter(Boolean))];
    const comprobaciones = await Promise.all(codigosUnicos.map(async (codigo) => {
        const resultados = await buscarArticulosPorCodigoParcial(codigo, idUbicacion);
        const codigoBuscado = codigo.toLocaleUpperCase("es");
        const existe = Array.isArray(resultados) && resultados.some((articulo) =>
            String(articulo?.codigoArticulo || "").trim().toLocaleUpperCase("es") === codigoBuscado
        );
        return existe ? null : codigo;
    }));

    return comprobaciones.filter(Boolean);
}

const API_URL = "http://localhost:8080/api/articulos";

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

export async function obtenerCodigosNoInventariados(codigos) {
    const codigosUnicos = [...new Set((codigos || []).map((codigo) => String(codigo).trim()).filter(Boolean))];
    const comprobaciones = await Promise.all(codigosUnicos.map(async (codigo) => {
        const resultados = await buscarArticulosPorCodigoParcial(codigo);
        const codigoBuscado = codigo.toLocaleUpperCase("es");
        const existe = Array.isArray(resultados) && resultados.some((articulo) =>
            String(articulo?.codigoArticulo || "").trim().toLocaleUpperCase("es") === codigoBuscado
        );
        return existe ? null : codigo;
    }));

    return comprobaciones.filter(Boolean);
}

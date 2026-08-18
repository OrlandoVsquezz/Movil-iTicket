//Configuracion de URL
const API_URL = "http://localhost:8080/api/tickets";

//Obtener los contadores de tickets propios segun el estado
export async function getIndicadoresEstadoPropios(idUsuario) {
    try{
        const respuesta = await fetch(`${API_URL}/indicadores/${idUsuario}`);

        if(!respuesta.ok){
            console.error("Error al obtener los indicadores de estado de los tickets");
            throw new Error("Error al obtener los indicadores de estado de los tickets");
        }

        const contadores = await respuesta.json();
        return contadores.data;
    } catch (error){
        console.error("Error al obtener los indicadores de estado de los tickets:", error);
        throw error;
    }
}

export async function getTicketsPropios(idUsuario, pagina = 1, tamano = 5, filtros = {}) {
    try {
        const parametros = new URLSearchParams({idUsuario, pagina, tamano})

        if(filtros.busqueda) parametros.append("busqueda", filtros.busqueda);
        if(filtros.prioridad) parametros.append("prioridad", filtros.prioridad);
        if(filtros.estado) parametros.append("estado", filtros.estado);
        if(filtros.fecha) parametros.append("fecha", filtros.fecha);

        const respuesta = await fetch(`${API_URL}/mis-tickets?${parametros}`);

        if (!respuesta.ok) {
            throw new Error("Error al obtener los tickets asignados");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    }
    catch (error) {
        console.error("Error al obtener tickets asignados:", error);
        throw error;
    }
}

export async function getResumenSemanal(idUsuario) {
    try{
        const respuesta = await fetch(`${API_URL}/resumen-semanal/${idUsuario}`);

        if(!respuesta.ok){
            console.error("Error al obtener el resumen semanal");
            throw new Error("Error al obtener el resumen semanal")
        }

        const contadores = await respuesta.json();
        return contadores.data;
    } catch (error){
        console.error("Error al obtener el resumen semanal:", error);
        throw error;
    }
}
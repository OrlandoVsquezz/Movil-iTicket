/* URL de la API */
const API_URL = 'http://localhost:8080/api/fases';

/* Metodo para obtener la lista de fases por Proyecto */
export async function obtenerFasesPorProyecto(idProyecto) {
    try {
        const response = await fetch(`${API_URL}/proyecto/${idProyecto}`);
        if (!response.ok) {
            throw new Error('Error al obtener las fases');
        }
        return await response.json();
    } catch (error) {
        console.error('Error en obtenerFasesPorProyecto:', error);
        throw error;
    }
}
/* URL de la API */
const API_URL = 'http://localhost:8080/api/detalleFase';

/* Método para obtener todos los detalles por fase */
export async function obtenerDetallesPorFase(idFase) {
    try {
        const response = await fetch(`${API_URL}/idFase/${idFase}`);
        if (!response.ok) {
            throw new Error('Error al obtener los detalles de la fase');
        }
        return await response.json();
    } catch (error) {
        console.error('Error en obtenerDetallesPorFase:', error);
        throw error;
    }
}

/* Metodo para editar los detalles de una fase */
export async function editarDetallesFase(idFase, datos) {
    try {
        const response = await fetch(`${API_URL}/${idFase}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        if (!response.ok) {
            throw new Error('Error al editar los detalles de la fase');
        }
        return await response.json();
    } catch (error) {
        console.error('Error en editarDetallesFase:', error);
        throw error;
    }
}

/* Metodo para eliminar los detalles de una fase */
export async function eliminarDetallesFase(idFase) {
    try {
        const response = await fetch(`${API_URL}/${idFase}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Error al eliminar los detalles de la fase');
        }
        return await response.json();
    } catch (error) {
        console.error('Error en eliminarDetallesFase:', error);
        throw error;
    }
}
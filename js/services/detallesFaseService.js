/* URL de la API */
const API_URL = 'http://localhost:8080/api/detalleFase';

/* Método para obtener todos los detalles por fase */
export async function obtenerDetallesPorFase(idFase) {
    try {
        const response = await fetch(`${API_URL}/idFase/${idFase}`);

        // 404 -> la fase todavia no tiene detalles registrados
        if (response.status === 404) {
            return [];
        }

        if (!response.ok) {
            throw new Error('Error al obtener los detalles de la fase');
        }

        const resultado = await response.json();
        return resultado.data;
    } catch (error) {
        console.error('Error en obtenerDetallesPorFase:', error);
        throw error;
    }
}

/* Metodo para crear un nuevo detalle de fase */
export async function crearDetalleFase(datos) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const cuerpo = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(cuerpo?.message || 'Error al crear el detalle de la fase');
        }

        return cuerpo.data;
    } catch (error) {
        console.error('Error en crearDetalleFase:', error);
        throw error;
    }
}

/* Metodo para editar un detalle de fase existente (id = idDetalleFase) */
export async function editarDetallesFase(idDetalle, datos) {
    try {
        const response = await fetch(`${API_URL}/${idDetalle}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const cuerpo = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(cuerpo?.message || 'Error al editar el detalle de la fase');
        }

        return cuerpo.data;
    } catch (error) {
        console.error('Error en editarDetallesFase:', error);
        throw error;
    }
}

/* Metodo para eliminar un detalle de fase existente (id = idDetalleFase) */
export async function eliminarDetallesFase(idDetalle) {
    try {
        const response = await fetch(`${API_URL}/${idDetalle}`, {
            method: 'DELETE'
        });

        // 204 No Content -> el detalle fue eliminado correctamente
        if (response.status === 204) {
            return true;
        }

        if (!response.ok) {
            const cuerpo = await response.json().catch(() => null);
            throw new Error(cuerpo?.message || 'Error al eliminar el detalle de la fase');
        }

        return true;
    } catch (error) {
        console.error('Error en eliminarDetallesFase:', error);
        throw error;
    }
}

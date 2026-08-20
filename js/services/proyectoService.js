import { API_BASE_URL } from "./apiConfig.js";
const API_URL = `${API_BASE_URL}/proyectos`;

/* Metodo para obtener los proyectos */
export async function obtenerProyectos() {
    try {
        const response = await fetch(API_URL);

        // 204 No Content -> no hay proyectos registrados todavia
        if (response.status === 204) {
            return [];
        }

        if (!response.ok) {
            throw new Error('Error al obtener los proyectos');
        }

        const resultado = await response.json();
        return resultado.data;
    } catch (error) {
        console.error('Error en obtenerProyectos:', error);
        throw error;
    }
}

/* Metodo para obtener los proyectos de forma paginada (igual que getTicketsPropios en ticketsService.js) */
export async function obtenerProyectosPaginados(pagina = 1, tamano = 5) {
    try {
        const parametros = new URLSearchParams({ pagina, tamano });
        const response = await fetch(`${API_URL}/pagina?${parametros}`);

        if (!response.ok) {
            throw new Error('Error al obtener los proyectos');
        }

        const resultado = await response.json();
        return resultado.data;
    } catch (error) {
        console.error('Error en obtenerProyectosPaginados:', error);
        throw error;
    }
}

/* Metodo para obtener un proyecto por ID */
export async function obtenerProyectoPorId(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            throw new Error('Error al obtener el proyecto');
        }
        const resultado = await response.json();
        return resultado.data;
    } catch (error) {
        console.error('Error en obtenerProyectoPorId:', error);
        throw error;
    }
}

/* Metodo para obtener un proyecto por nombre (coincidencia parcial) */
export async function obtenerProyectoPorNombre(nombre) {
    try {
        const response = await fetch(`${API_URL}/nombre?nombre=${encodeURIComponent(nombre)}`);

        if (response.status === 404) {
            return [];
        }

        if (!response.ok) {
            throw new Error('Error al obtener el proyecto');
        }

        const resultado = await response.json();
        return resultado.data;
    } catch (error) {
        console.error('Error en obtenerProyectoPorNombre:', error);
        throw error;
    }
}

/* Funcion para obtener proyectos por tipo (Construcción, Remodelación, Ampliación, Mantenimiento) */
export async function obtenerProyectosPorTipo(tipo) {
    try {
        // El backend expone /api/proyectos/tipo/{tipo} (path variable, no query param)
        const response = await fetch(`${API_URL}/tipo/${encodeURIComponent(tipo)}`);

        if (response.status === 404) {
            return [];
        }

        if (!response.ok) {
            throw new Error('Error al obtener los proyectos');
        }

        const resultado = await response.json();
        return resultado.data;
    } catch (error) {
        console.error('Error en obtenerProyectosPorTipo:', error);
        throw error;
    }
}

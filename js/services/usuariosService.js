import { API_BASE_URL } from "./apiConfig.js";
const API_URL = `${API_BASE_URL}/usuarios`;

//Obtener la lista completa de usuarios
export async function getUsuarios() {
    try {
        const respuesta = await fetch(API_URL);
        if (!respuesta.ok) throw new Error("Error al obtener los usuarios");
        const resultado = await respuesta.json();
        return resultado.data;
    }
    catch (error) {
        console.error("Error al obtener usuarios:", error);
        throw error;
    }
}

export async function getTecnicosPorDepartamento(idDepartamento) {
    try {
        const respuesta = await fetch(`${API_URL}/tecnicos?idDepartamento=${idDepartamento}`);
        if (respuesta.ok) {
            const resultado = await respuesta.json();
            return resultado.data;
        }

        // Compatibilidad con la API actual: si el filtro de técnicos falla,
        // se usa el listado existente y se aplica exactamente el mismo filtro aquí.
        const usuarios = await getUsuarios();
        return usuarios.filter((usuario) => {
            const rol = (usuario.nombreRol || "").toLowerCase();
            const esTecnico = rol === "tecnico" || rol === "administrador" ||
                Number(usuario.idRol) === 1 || Number(usuario.idRol) === 2;
            const estaActivo = usuario.estado === true || String(usuario.estado).toUpperCase() === "T";
            const mismoDepartamento = Number(usuario.idDepartamento) === Number(idDepartamento);
            return esTecnico && estaActivo && mismoDepartamento;
        });
    }
    catch (error) {
        console.error("Error al obtener técnicos:", error);
        throw error;
    }
}

//Funcion para obtener a la persona que esta usando el sistema
export async function getUsuarioId(idUsuario) {
    try{
        const respuesta = await fetch(`${API_URL}/${idUsuario}`);

        if(!respuesta.ok){
            console.error("Error al obtener los datos del usuario");
            throw new Error("Error al obtener los datos del usuario");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    }catch (error) {
        console.error("Error al obtener el usuario:", error);
        throw error;
    }
}

// Lee los datos del usuario que inició sesión (guardados por login.js en sessionStorage al autenticarse)
export function obtenerUsuarioLogueado() {
    const datos = sessionStorage.getItem("usuarioLogueado");
    if (!datos) return null;

    try {
        return JSON.parse(datos);
    } catch (error) {
        console.error("No se pudo leer el usuario logueado:", error);
        return null;
    }
}

export const ROLES = Object.freeze({
    ADMINISTRADOR: 1,
    TECNICO: 2,
    USUARIO: 3
});

// La API de autenticación devuelve el rol como idRol. Se normaliza aquí para
// que todas las pantallas tomen la misma decisión al construir sus menús.
export function obtenerIdRol() {
    const usuario = obtenerUsuarioLogueado();
    const idRol = Number(usuario?.idRol);
    return Number.isInteger(idRol) ? idRol : null;
}

export function obtenerNombreRol() {
    const nombres = {
        [ROLES.ADMINISTRADOR]: "Administrador",
        [ROLES.TECNICO]: "Tecnico",
        [ROLES.USUARIO]: "Usuario"
    };

    return nombres[obtenerIdRol()] || null;
}

export function paginaTicketsPorRol(idRol = obtenerIdRol()) {
    if (idRol === ROLES.ADMINISTRADOR) return "gestionTickets.html";
    if (idRol === ROLES.TECNICO) return "ticketsAsignados.html";
    return "misTickets.html";
}

export function cerrarSesion() {
    sessionStorage.removeItem("usuarioLogueado");
}

// Devuelve el id del usuario logueado. Si no hay sesión guardada, redirige al login.
export function obtenerIdUsuario() {
    const usuario = obtenerUsuarioLogueado();

    if (!usuario || !usuario.idUsuario) {
        window.location.href = "index.html";
        return null;
    }

    return usuario.idUsuario;
}

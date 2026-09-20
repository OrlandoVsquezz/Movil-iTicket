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

// Devuelve el id del usuario logueado. Si no hay sesión guardada, redirige al login.
export function obtenerIdUsuario() {
    const usuario = obtenerUsuarioLogueado();

    if (!usuario || !usuario.idUsuario) {
        window.location.href = "index.html";
        return null;
    }

    return usuario.idUsuario;
}

/* Convierte el nombre del rol que viene de la base ("Administrador", "Tecnico", "Usuario")
   en una clave corta: "admin", "tecnico" o "usuario". */
export function normalizarRol(nombreRol) {
    const texto = String(nombreRol ?? "").toLowerCase();
    if (texto.includes("admin")) return "admin";
    if (texto.includes("tecnic") || texto.includes("técnic")) return "tecnico";
    return "usuario";
}

// Los ids de rol vienen fijos en el script de la base: 1 Administrador, 2 Tecnico, 3 Usuario
const ROLES_POR_ID = { 1: "admin", 2: "tecnico", 3: "usuario" };

/* Rol del usuario que inició sesión. Se usa el nombre del rol y, si la sesión no lo trae
   (el login antiguo solo guardaba idRol), se deduce del id. */
export function obtenerRolUsuario() {
    const usuario = obtenerUsuarioLogueado();
    if (!usuario) return "usuario";

    const nombre = usuario.nombreRol ?? usuario.rol;
    if (nombre) return normalizarRol(nombre);

    return ROLES_POR_ID[Number(usuario.idRol)] ?? "usuario";
}

// En vez de repetir http://localhost:8080/api en cada servicio, se centraliza aquí para que cuando haya un dominio real solo se
// cambie aqui
export const API_BASE_URL = "http://localhost:8080/api";

const PAGINAS_PUBLICAS = [
    "", "index.html", "login.html", "logincodigo.html", "logincontraseña.html",
    "logingoogle.html", "loginrecuperarcontraseña.html", "pantallacarga.html"
];

export function esPaginaPublica() {
    const pagina = window.location.pathname.split("/").pop().toLowerCase();
    return PAGINAS_PUBLICAS.includes(pagina);
}

export function limpiarSesionLocal() {
    sessionStorage.clear();
}

export async function apiFetch(url, opciones = {}) {
    const respuesta = await fetch(url, { ...opciones, credentials: "include" });

    if (respuesta.status === 401 && !esPaginaPublica()) {
        limpiarSesionLocal();
        window.location.replace("index.html");
    }
    return respuesta;
}

export async function manejarRespuesta(respuesta) {
    if (respuesta.status === 204) return null;

    let cuerpo = null;
    try {
        cuerpo = await respuesta.json();
    } catch (e) {
    }

    if (!respuesta.ok || (cuerpo && cuerpo.success === false)) {
        const mensaje = (cuerpo && (cuerpo.message || cuerpo.error)) || `Error ${respuesta.status}`;
        const errorObj = new Error(mensaje);
        if (cuerpo && cuerpo.errorCode) errorObj.errorCode = cuerpo.errorCode;
        throw errorObj;
    }

    if (cuerpo && Object.prototype.hasOwnProperty.call(cuerpo, 'data')) {
        return cuerpo.data;
    }
    return cuerpo;
}
import { actualizarFotoPerfil, cambiarClave, getUsuarioId } from "../services/usuariosService.js";
import { obtenerIdUsuario as obtenerIdUsuarioSesion, obtenerUsuarioLogueado } from "../utils/sesion.js";
import { mostrarError, mostrarExitoSimple } from "../components/notificacionesUI.js";

// Elementos del HTML (estos mientras se carga la info tienen un texto que dice cargando... cuando se conecta bien con la api se pone la info)
const perfilImagen = document.querySelector("#perfil-imagen");
const nombre = document.querySelector("#perfil-nombre");
const rol =  document.querySelector("#perfil-rol");
const nombreDetalle =  document.querySelector("#perfil-nombre-detalle");
const departamento = document.querySelector("#perfil-departamento");
const correoElectronico = document.querySelector("#perfil-correo"); 
const contenedorImagen = document.querySelector(".imagen-perfil");
const botonCambiarFoto = document.querySelector("#btn-cambiar-foto");
const inputFotoPerfil = document.querySelector("#input-foto-perfil");
const estadoFotoPerfil = document.querySelector("#estado-foto-perfil");
const botonCambiarClave = document.querySelector("#btn-cambiar-clave");
const formCambioClave = document.querySelector("#form-cambio-clave");
const botonGuardarClave = document.querySelector("#btn-guardar-clave");
const estadoClave = document.querySelector("#estado-clave");

const elementosPerfil = {
    imagen: perfilImagen,
    nombre: nombre,
    rol: rol,
    nombreDetalle: nombreDetalle,
    departamento: departamento,
    correo: correoElectronico
};

// Usa el ?id= de la dirección si viene (ver el perfil de otro usuario), o el de la sesión si no (mi propio perfil)
function obtenerIdUsuario() {
    const parametros = new URLSearchParams(window.location.search);
    const idDesdeUrl = Number(parametros.get("id"));

    if (Number.isInteger(idDesdeUrl) && idDesdeUrl > 0) {
        return idDesdeUrl;
    }

    return obtenerIdUsuarioSesion();
}

// Coloca en el HTML los datos recibidos desde la API
function mostrarUsuario(usuario) {
    elementosPerfil.nombre.textContent = usuario.nombreUsuario || "Sin nombre";
    elementosPerfil.rol.textContent = usuario.nombreRol || "Sin rol";
    elementosPerfil.nombreDetalle.textContent = usuario.nombreUsuario || "Sin nombre";
    elementosPerfil.departamento.textContent = usuario.nombreDepartamento || "Sin departamento";
    elementosPerfil.correo.textContent = usuario.correo || "Sin correo";

    // Foto real si el usuario tiene una, o un avatar con inicial y fondo degradado azul si no
    mostrarImagenPerfil(usuario.imagenUrl, usuario.nombreUsuario);
}

function mostrarImagenPerfil(imagenUrl, nombreUsuario, animar = false) {
    if (!imagenUrl) {
        mostrarInicialPerfil(nombreUsuario);
        return;
    }

    const imagen = document.createElement("img");
    imagen.id = "perfil-imagen";
    imagen.alt = `Foto de perfil de ${nombreUsuario || "usuario"}`;
    imagen.className = `perfil-imagen-real${animar ? " foto-actualizada" : ""}`;
    imagen.addEventListener("error", () => mostrarInicialPerfil(nombreUsuario), { once: true });
    imagen.src = imagenUrl;
    contenedorImagen.replaceChildren(imagen);
    elementosPerfil.imagen = imagen;
}

// Reemplaza la <img> de perfil por un círculo con la inicial del nombre y fondo degradado azul
function mostrarInicialPerfil(nombreUsuario) {
    const inicial = (nombreUsuario || "").trim().charAt(0).toUpperCase() || "?";

    const div = document.createElement("div");
    div.className = "avatar-perfil-inicial";
    div.textContent = inicial;
    div.setAttribute("role", "img");
    div.setAttribute("aria-label", `Foto de perfil de ${nombreUsuario || "usuario"}`);
    div.style.background = generarDegradadoAzul();

    contenedorImagen.replaceChildren(div);
    elementosPerfil.imagen = div;
}

// Azul aleatorio distinto en cada carga (igual que en inicio.js)
function generarDegradadoAzul() {
    const tonoBase = Math.floor(Math.random() * (240 - 210 + 1)) + 210;
    const tonoSecundario = tonoBase + 15;
    const color1 = `hsl(${tonoBase}, 85%, 35%)`;
    const color2 = `hsl(${tonoSecundario}, 85%, 20%)`;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
}

// Muestra mensajes de error al no poder traer datos de la API
function mostrarErrorPerfil(mensaje) {
    elementosPerfil.nombre.textContent = mensaje;
    elementosPerfil.rol.textContent = "";
    elementosPerfil.nombreDetalle.textContent = "No disponible";
    elementosPerfil.departamento.textContent = "No disponible";
    elementosPerfil.correo.textContent = "No disponible";
}

// Solicita a la API el usuario indicado en la pagina (perfil.html?id=5 trae al usuario con id=5)
async function cargarPerfil(idUsuario) {
    try {
        const usuario = await getUsuarioId(idUsuario); // Aqui se ocupa el usuarioService

        if (!usuario) {
            throw new Error("La API no devolvio los datos del usuario");
        }

        mostrarUsuario(usuario);
    } catch (error) {
        mostrarErrorPerfil("No se pudo cargar el perfil");
        mostrarError("No se pudo cargar la información del perfil.");
        console.error("No se pudo cargar el perfil:", error);
    }
}

function mostrarEstadoFoto(mensaje = "", tipo = "") {
    estadoFotoPerfil.textContent = mensaje;
    estadoFotoPerfil.dataset.tipo = tipo;
}

async function guardarFotoPerfil(archivo) {
    const formatosPermitidos = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!formatosPermitidos.has(archivo.type)) {
        mostrarEstadoFoto("Usa una imagen JPG, PNG o WEBP.", "error");
        return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
        mostrarEstadoFoto("La imagen no puede superar 5 MB.", "error");
        return;
    }

    const usuarioSesion = obtenerUsuarioLogueado();
    if (!usuarioSesion?.idUsuario) {
        mostrarError("Inicia sesión para cambiar tu foto.");
        return;
    }

    botonCambiarFoto.disabled = true;
    botonCambiarFoto.classList.add("cargando");
    botonCambiarFoto.querySelector(".label-bold").textContent = "Subiendo imagen…";
    mostrarEstadoFoto("Guardando tu nueva foto…", "cargando");

    try {
        const actualizado = await actualizarFotoPerfil(usuarioSesion.idUsuario, archivo);
        const imagenUrl = actualizado?.imagenUrl;
        if (!imagenUrl) throw new Error("No se recibió la nueva imagen.");

        const usuarioActualizado = { ...usuarioSesion, ...actualizado, imagenUrl };
        sessionStorage.setItem("usuarioLogueado", JSON.stringify(usuarioActualizado));
        mostrarImagenPerfil(imagenUrl, usuarioActualizado.nombreUsuario, true);
        mostrarEstadoFoto("Foto actualizada correctamente.", "exito");
        mostrarExitoSimple("Foto actualizada", "Tu nueva foto de perfil ya está guardada.");
    } catch (error) {
        const mensaje = error instanceof TypeError
            ? "No se pudo conectar con el servidor. Intenta nuevamente."
            : (error.message || "No se pudo actualizar la foto.");
        mostrarEstadoFoto(mensaje, "error");
        mostrarError(mensaje);
    } finally {
        botonCambiarFoto.disabled = false;
        botonCambiarFoto.classList.remove("cargando");
        botonCambiarFoto.querySelector(".label-bold").textContent = "Cambiar foto de perfil";
    }
}

// Igual que en la web: no hay columna en la BD para saber si es el primer inicio de sesión,
// así que se recuerda por usuario en este navegador hasta que cambie su contraseña
function claveCambioPendiente(idUsuario) {
    try {
        return localStorage.getItem(`iticket_clave_cambiada_${idUsuario}`) !== "true";
    } catch (error) {
        return false;
    }
}

function marcarClaveCambiada(idUsuario) {
    try {
        localStorage.setItem(`iticket_clave_cambiada_${idUsuario}`, "true");
    } catch (error) {
        console.warn("No se pudo recordar el cambio de contraseña:", error);
    }
}

function mostrarEstadoClave(mensaje = "", tipo = "") {
    estadoClave.textContent = mensaje;
    estadoClave.dataset.tipo = tipo;
}

function cerrarFormularioClave() {
    formCambioClave.hidden = true;
    formCambioClave.reset();
    botonCambiarClave.setAttribute("aria-expanded", "false");
}

botonCambiarClave.addEventListener("click", () => {
    mostrarEstadoClave();
    if (!formCambioClave.hidden) {
        cerrarFormularioClave();
        return;
    }
    formCambioClave.hidden = false;
    botonCambiarClave.setAttribute("aria-expanded", "true");
    formCambioClave.scrollIntoView({ block: "nearest", behavior: "smooth" });
    formCambioClave.querySelector("#txt-clave-actual").focus();
});

document.querySelector("#btn-cancelar-clave").addEventListener("click", cerrarFormularioClave);

formCambioClave.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const idUsuario = obtenerUsuarioLogueado()?.idUsuario;
    const actual = formCambioClave.querySelector("#txt-clave-actual").value;
    const nueva = formCambioClave.querySelector("#txt-clave-nueva").value;
    const confirmar = formCambioClave.querySelector("#txt-clave-confirmar").value;

    let error = null;
    if (!idUsuario) error = "Inicia sesión para cambiar tu contraseña.";
    else if (!actual || !nueva || !confirmar) error = "Completa los tres campos.";
    else if (nueva.length < 8) error = "La nueva contraseña debe tener al menos 8 caracteres.";
    else if (nueva !== confirmar) error = "Las contraseñas nuevas no coinciden.";
    else if (nueva === actual) error = "La nueva contraseña debe ser diferente a la actual.";
    if (error) {
        mostrarEstadoClave(error, "error");
        return;
    }

    botonGuardarClave.disabled = true;
    mostrarEstadoClave("Guardando la nueva contraseña…", "cargando");
    try {
        await cambiarClave(idUsuario, actual, nueva);
        marcarClaveCambiada(idUsuario);
        cerrarFormularioClave();
        botonCambiarClave.classList.remove("clave-pendiente");
        mostrarEstadoClave("Contraseña actualizada correctamente.", "exito");
        mostrarExitoSimple("Contraseña actualizada", "Usa tu nueva contraseña la próxima vez que inicies sesión.");
    } catch (errorApi) {
        const mensaje = errorApi instanceof TypeError
            ? "No se pudo conectar con el servidor. Intenta nuevamente."
            : (errorApi.message || "No se pudo cambiar la contraseña.");
        mostrarEstadoClave(mensaje, "error");
    } finally {
        botonGuardarClave.disabled = false;
    }
});

botonCambiarFoto.addEventListener("click", () => inputFotoPerfil.click());
inputFotoPerfil.addEventListener("change", async () => {
    const archivo = inputFotoPerfil.files?.[0];
    inputFotoPerfil.value = "";
    if (archivo) await guardarFotoPerfil(archivo);
});

// Inicia la carga del perfil cuando el HTML esta listo
document.addEventListener("DOMContentLoaded", function () {
    const idUsuario = obtenerIdUsuario();
    const idUsuarioSesion = Number(obtenerUsuarioLogueado()?.idUsuario);

    if (!idUsuario) {
        mostrarErrorPerfil("ID de usuario no valido");
        console.error("Agrega un ID valido a la direccion. Ejemplo: perfil.html?id=1");
        return;
    }

    if (Number(idUsuario) !== idUsuarioSesion) {
        botonCambiarFoto.hidden = true;
        inputFotoPerfil.disabled = true;
        botonCambiarClave.hidden = true;
    } else {
        botonCambiarClave.classList.toggle("clave-pendiente", claveCambioPendiente(idUsuarioSesion));
    }

    cargarPerfil(idUsuario);
});


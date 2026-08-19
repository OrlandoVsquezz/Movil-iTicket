import { getUsuarioId } from "../services/usuariosService.js";

// Elementos del HTML (estos mientras se carga la info tienen un texto que dice cargando... cuando se conecta bien con la api se pone la info)
const perfilImagen = document.querySelector("#perfil-imagen");
const nombre = document.querySelector("#perfil-nombre");
const rol =  document.querySelector("#perfil-rol");
const nombreDetalle =  document.querySelector("#perfil-nombre-detalle");
const departamento = document.querySelector("#perfil-departamento");
const correoElectronico = document.querySelector("#perfil-correo"); 

const elementosPerfil = {
    imagen: perfilImagen,
    nombre: nombre,
    rol: rol,
    nombreDetalle: nombreDetalle,
    departamento: departamento,
    correo: correoElectronico
};

// Lee el id que se escriba en la dirección 
function obtenerIdUsuario() {
    const parametros = new URLSearchParams(window.location.search);
    const idUsuario = Number(parametros.get("id"));

    // Para ver que el número sea mayor que 0
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        return null;
    }

    return idUsuario;
}

// Coloca en el HTML los datos recibidos desde la API
function mostrarUsuario(usuario) {
    elementosPerfil.nombre.textContent = usuario.nombreUsuario || "Sin nombre";
    elementosPerfil.rol.textContent = usuario.nombreRol || "Sin rol";
    elementosPerfil.nombreDetalle.textContent = usuario.nombreUsuario || "Sin nombre";
    elementosPerfil.departamento.textContent = usuario.nombreDepartamento || "Sin departamento";
    elementosPerfil.correo.textContent = usuario.correo || "Sin correo";

    // El logo predeterminado se conserva cuando el usuario no tiene una
    if (usuario.imagenUrl) {
        elementosPerfil.imagen.src = usuario.imagenUrl;
    }
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
        console.error("No se pudo cargar el perfil:", error);
    }
}

// Inicia la carga del perfil cuando el HTML esta listo
document.addEventListener("DOMContentLoaded", function () {
    const idUsuario = obtenerIdUsuario();

    if (!idUsuario) {
        mostrarErrorPerfil("ID de usuario no valido");
        console.error("Agrega un ID valido a la direccion. Ejemplo: perfil.html?id=1");
        return;
    }

    cargarPerfil(idUsuario);
});


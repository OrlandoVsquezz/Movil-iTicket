import { getUsuarioId } from "../services/usuariosService.js";
import { getTicketsPropios } from "../services/ticketsService.js";
import { obtenerIdUsuario } from "../utils/sesion.js";

const idUsuario = obtenerIdUsuario();

document.addEventListener("DOMContentLoaded", () => {

    const chatForm = document.getElementById("chatForm");
    const messageInput = document.getElementById("messageInput");
    const messagesContainer = document.getElementById("contenedorMensajes");
    const addButton = document.getElementById("addButton");
    const avatarUsuario = document.getElementById("chatAvatarBot");

    // Muestra la foto real del usuario que usa la app, o su inicial con fondo degradado azul si no tiene
    mostrarAvatarUsuario();

    async function mostrarAvatarUsuario() {
        if (!avatarUsuario) return;

        try {
            const usuario = await getUsuarioId(idUsuario);
            if (usuario.imagenUrl) {
                avatarUsuario.src = usuario.imagenUrl;
                avatarUsuario.alt = `Foto de perfil de ${usuario.nombreUsuario}`;
            } else {
                mostrarInicialUsuario(usuario.nombreUsuario);
            }
        } catch (error) {
            console.error("Error al obtener el usuario:", error);
        }
    }

    function mostrarInicialUsuario(nombreUsuario) {
        const inicial = (nombreUsuario || "").trim().charAt(0).toUpperCase() || "?";

        const div = document.createElement("div");
        div.className = "chat-avatar-inicial";
        div.textContent = inicial;
        div.setAttribute("role", "img");
        div.setAttribute("aria-label", `Foto de perfil de ${nombreUsuario || "usuario"}`);
        div.style.background = generarDegradadoAzul();

        avatarUsuario.replaceWith(div);
    }

    // Azul aleatorio distinto en cada carga
    function generarDegradadoAzul() {
        const tonoBase = Math.floor(Math.random() * (240 - 210 + 1)) + 210;
        const tonoSecundario = tonoBase + 15;
        const color1 = `hsl(${tonoBase}, 85%, 35%)`;
        const color2 = `hsl(${tonoSecundario}, 85%, 20%)`;
        return `linear-gradient(135deg, ${color1}, ${color2})`;
    }

    // Simulacion del chatbot contestando
    function agregarMensaje(texto, tipo) {

        const mensaje = document.createElement("div");

        mensaje.classList.add(
            "mensaje",
            tipo
        );

        const contenido = document.createElement("p");
        contenido.classList.add("texto");
        contenido.textContent = texto;
        mensaje.appendChild(contenido);
        messagesContainer.appendChild(mensaje);
        desplazarseAlFinal();
        return mensaje;
    }

    function mostrarEscribiendo() {

        const mensaje = document.createElement("div");

        mensaje.classList.add(
            "mensaje",
            "bot",
            "typing"
        );

        for (let i = 0; i < 3; i++) {
            const punto = document.createElement("span");
            punto.classList.add("typing-dot");
            mensaje.appendChild(punto);
        }

        messagesContainer.appendChild(mensaje);
        desplazarseAlFinal();
        return mensaje;
    }

    function desplazarseAlFinal() {

        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: "smooth"
        });
    }


    async function obtenerRespuesta(texto) {
        try {
            const pagina = await getTicketsPropios(idUsuario, 1, 100);
            const tickets = pagina?.tickets || [];
            const consulta = texto.toLowerCase();

            if (consulta.includes("pendiente")) {
                const total = tickets.filter(ticket => (ticket.estado || "").toLowerCase() === "pendiente").length;
                return `Tienes ${total} ticket${total === 1 ? "" : "s"} pendiente${total === 1 ? "" : "s"}.`;
            }
            if (consulta.includes("resuelto") || consulta.includes("cerrado")) {
                const total = tickets.filter(ticket => ["resuelto", "cerrado"].includes((ticket.estado || "").toLowerCase())).length;
                return `Tienes ${total} ticket${total === 1 ? "" : "s"} resuelto${total === 1 ? "" : "s"} o cerrado${total === 1 ? "" : "s"}.`;
            }

            const activos = tickets.filter(ticket => !["resuelto", "cerrado"].includes((ticket.estado || "").toLowerCase())).length;
            return `Tienes ${tickets.length} tickets en total y ${activos} activos.`;
        } catch (error) {
            console.error("No se pudo consultar el resumen de tickets:", error);
            return "No pude consultar tus tickets en este momento. Inténtalo nuevamente.";
        }
    }

    async function enviarMensaje() {

        const texto = messageInput.value.trim();

        if (!texto) {
            return;
        }

        agregarMensaje(
            texto,
            "usuario"
        );

        messageInput.value = "";
        messageInput.focus();
        messageInput.disabled = true;

        const indicador =
            mostrarEscribiendo();

        await esperar(1200);

        indicador.remove();

        /*
         * Respuesta del bot
         */
        agregarMensaje(
            await obtenerRespuesta(texto),
            "bot"
        );

        messageInput.disabled = false;
        messageInput.focus();
    }

    function esperar(ms) {

        return new Promise(
            resolve => setTimeout(resolve, ms)
        );
    }

    chatForm.addEventListener("submit",
        (event) => {
            event.preventDefault();
            enviarMensaje();
        }
    );

    addButton.addEventListener(
        "click",
        () => {
            console.log(
                "Botón de adjuntar presionado."
            );
        }
    );


});

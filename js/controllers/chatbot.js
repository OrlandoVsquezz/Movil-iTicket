import { enviarMensajeChatbot, obtenerConversacionChatbot } from "../services/chatbotService.js";
import { obtenerIdUsuario } from "../utils/sesion.js";

// Debe coincidir con la misma clave usada en historialChat.js
const CLAVE_CONVERSACION_SELECCIONADA = "chatConversacionSeleccionada";

document.addEventListener("DOMContentLoaded", () => {

    const chatForm = document.getElementById("chatForm");
    const messageInput = document.getElementById("messageInput");
    const messagesContainer = document.getElementById("contenedorMensajes");
    const addButton = document.getElementById("addButton");
    const idUsuario = obtenerIdUsuario();
    let idConversacionActiva = null;

    cargarConversacionSeleccionada();

    async function cargarConversacionSeleccionada() {
        const idSeleccionada = sessionStorage.getItem(CLAVE_CONVERSACION_SELECCIONADA);
        sessionStorage.removeItem(CLAVE_CONVERSACION_SELECCIONADA);

        if (!idSeleccionada || !idUsuario) return;

        try {
            const conversacion = await obtenerConversacionChatbot(idUsuario, idSeleccionada);
            idConversacionActiva = conversacion.idConversacion;
            messagesContainer.innerHTML = "";

            (conversacion.mensajes || []).forEach((mensaje) => {
                if (mensaje.rol === "user") agregarMensaje(mensaje.contenido, "usuario");
                if (mensaje.rol === "assistant") agregarMensaje(mensaje.contenido, "bot");
            });
        } catch (error) {
            console.error("No se pudo abrir la conversación:", error);
        }
    }

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


    async function enviarMensaje() {

        const texto = messageInput.value.trim();

        if (!texto || !idUsuario) {
            return;
        }

        agregarMensaje(
            texto,
            "usuario"
        );

        messageInput.value = "";
        ajustarAlturaMensaje();
        messageInput.focus();
        messageInput.disabled = true;

        const indicador =
            mostrarEscribiendo();

        try {
            const resultado = await enviarMensajeChatbot(
                idUsuario,
                texto,
                idConversacionActiva
            );

            idConversacionActiva = resultado?.idConversacion ?? idConversacionActiva;

            indicador.remove();
            agregarMensaje(
                resultado?.respuesta || "Lo siento, no recibí una respuesta válida.",
                "bot"
            );
        } catch (error) {
            indicador.remove();
            agregarMensaje(
                error.message || "No pude responder en este momento. Inténtalo nuevamente.",
                "bot"
            );
        }

        messageInput.disabled = false;
        messageInput.focus();
    }

    chatForm.addEventListener("submit",
        (event) => {
            event.preventDefault();
            enviarMensaje();
        }
    );

    addButton?.addEventListener(
        "click",
        () => {
            console.log(
                "Botón de adjuntar presionado."
            );
        }
    );

    document.querySelectorAll("[data-chat-sugerencia]").forEach((button) => {
        button.addEventListener("click", () => {
            messageInput.value = button.dataset.chatSugerencia || "";
            enviarMensaje();
        });
    });

    function ajustarAlturaMensaje() {
        messageInput.style.setProperty("height", "auto", "important");
        messageInput.style.setProperty("height", `${Math.min(messageInput.scrollHeight, 96)}px`, "important");
        messageInput.style.overflowY = messageInput.scrollHeight > 96 ? "auto" : "hidden";
    }

    messageInput.addEventListener("input", ajustarAlturaMensaje);
    ajustarAlturaMensaje();


});

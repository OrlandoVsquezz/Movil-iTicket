document.addEventListener("DOMContentLoaded", () => {

    const chatForm = document.getElementById("chatForm");
    const messageInput = document.getElementById("messageInput");
    const messagesContainer = document.getElementById("contenedorMensajes");
    const addButton = document.getElementById("addButton");

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


    function obtenerRespuesta() {

        return "Hola, ¿en qué puedo ayudarte?";
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
            obtenerRespuesta(),
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

    chatForm.addEventListener(
        "submit",
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
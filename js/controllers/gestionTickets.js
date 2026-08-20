let ticketsGestion = [];
let tecnicosDisponibles = [];
let departamentosDisponibles = [];

const ticketsPendientes = document.getElementById("ticketsPendientes");
const todosTickets = document.getElementById("todosTickets");
const dialogAprobacion = document.getElementById("dialogAprobacion");
const cerrarDialog = document.getElementById("cerrarDialog");
const formAprobacion = document.getElementById("formAprobacion");
const rechazarTicket = document.getElementById("rechazarTicket");
const visorEvidencias = document.getElementById("visorEvidencias");
const cerrarVisorEvidencias = document.getElementById("cerrarVisorEvidencias");
const fotoEvidenciaActual = document.getElementById("fotoEvidenciaActual");
const contadorEvidencias = document.getElementById("contadorEvidencias");
const miniaturasEvidencias = document.getElementById("miniaturasEvidencias");
const evidenciaAnterior = document.getElementById("evidenciaAnterior");
const evidenciaSiguiente = document.getElementById("evidenciaSiguiente");
const sltTecnico = document.getElementById("sltTecnico");
const sltDepartamentoDialog = document.getElementById("sltDepartamentoDialog");

let idTicketSeleccionado = null;
let evidenciasActuales = [];
let indiceEvidenciaActual = 0;
let datosApiCargados = false;

/* Dependiendo del tipo del ticket se  pondra la imagen en el ticket (aunque Katherine no se si no seran esos iconos, ya no me acuerdo) */
function obtenerIconoTicket(tipoTicket) {
    const iconos = {
        Articulo: "img/Computadora.png",
        General: "img/Caja.png",
        Software: "img/InstalacionSoft.png"
    };
    return iconos[tipoTicket] || "img/Computadora.png";
}

/* Muestra la tilde de Crítica */
function nombrePrioridad(prioridad) {
    return prioridad === "Critica" ? "Crítica" : prioridad;
}

function plantillaTicket(ticket, pendiente) {
    const insigniaPrioridad = ticket.prioridad
        ? `<span class="badge prioridad-${ticket.prioridad}">${nombrePrioridad(ticket.prioridad)}</span>`
        : "";

    return `
        <article class="ticket-card ${pendiente ? "ticket-gestion-pendiente" : ""}"
            data-id-ticket="${ticket.idTicket}">
            <header class="ticket-header">
                <div class="ticket-title-group">
                    <img src="${obtenerIconoTicket(ticket.tipoTicket)}" alt="" class="computer-icon">
                    <span class="dot">•</span>
                    <h2 class="ticket-title texto-limitado-2">${ticket.asunto}</h2>
                </div>

                <div class="header-actions">
                    <img src="img/Mensaje.png" alt="Abrir chat" class="chat-icon">
                    ${insigniaPrioridad}
                </div>
            </header>

            <div class="ticket-details">
                <p class="ticket-code">${ticket.codigo}</p>
                <p class="ticket-info"><strong>Estado:</strong> ${ticket.estado}</p>
                <p class="ticket-info"><strong>Técnico asignado:</strong> ${ticket.tecnico}</p>
            </div>

            <div class="ticket-description">
                <p class="description-title">Descripción:</p>
                <p class="description-text texto-limitado">${ticket.descripcion}</p>
            </div>
        </article>
    `;
}

function renderizarOpcionesApi(select, elementos, propiedadId, propiedadNombre, textoInicial) {
    select.innerHTML = `<option value="">${textoInicial}</option>`;

    elementos.forEach(function (elemento) {
        const opcion = document.createElement("option");
        opcion.value = elemento[propiedadId];
        opcion.textContent = elemento[propiedadNombre];
        select.appendChild(opcion);
    });
}

/*
    Después de insertar el HTML se agregan los eventListener
    ya que las tarjetas todavía no existían cuando se cargó inicialmente el JS.
*/
function renderizarTickets() {
    if (!datosApiCargados) {
        const mensajeEspera = '<p class="texto">Conectame a la API Katherine</p>';
        ticketsPendientes.innerHTML = mensajeEspera;
        todosTickets.innerHTML = mensajeEspera;
        return;
    }

    const pendientes = ticketsGestion.filter(ticket => ticket.estado === "Nuevo");

    ticketsPendientes.innerHTML = pendientes.length
        ? pendientes.map(ticket => plantillaTicket(ticket, true)).join("")
        : '<p class="texto">No hay aprobaciones pendientes.</p>';

    todosTickets.innerHTML = ticketsGestion.length
        ? ticketsGestion.map(ticket => plantillaTicket(ticket, ticket.estado === "Nuevo")).join("")
        : '<p class="texto">No hay tickets para mostrar.</p>';

    document.querySelectorAll(".ticket-gestion-pendiente").forEach(tarjeta => {
        tarjeta.addEventListener("click", function (evento) {
            if (evento.target.closest(".chat-icon")) return;
            abrirDialog(Number(tarjeta.dataset.idTicket));
        });
    });
}

/*
    Muestra únicamente la primera fotografía en el diálogo principal. Si hay
    más, la insignia informa cuántas faltan por ver dentro del visor
*/
function renderizarEvidencias(evidencias) {
    const contenedor = document.getElementById("dialogEvidencias");
    evidenciasActuales = evidencias;
    indiceEvidenciaActual = 0;

    if (!evidencias.length) {
        contenedor.innerHTML = '<p class="sin-evidencias-dialog">Sin fotografías</p>';
        return;
    }

    const cantidadAdicional = evidencias.length - 1;
    contenedor.innerHTML = `
        <button type="button" class="evidencia-principal" id="abrirVisorEvidencias"
            aria-label="Ver ${evidencias.length} fotografías del ticket">
            <img src="${evidencias[0]}" alt="Primera evidencia del ticket">
            ${cantidadAdicional > 0 ? `<span class="cantidad-evidencias">+${cantidadAdicional}</span>` : ""}
        </button>
    `;

    document.getElementById("abrirVisorEvidencias").addEventListener("click", abrirGaleriaEvidencias);
}

function abrirGaleriaEvidencias() {
    if (!evidenciasActuales.length) return;
    indiceEvidenciaActual = 0;
    actualizarGaleriaEvidencias();
    visorEvidencias.showModal();
}

function actualizarGaleriaEvidencias() {
    fotoEvidenciaActual.src = evidenciasActuales[indiceEvidenciaActual];
    fotoEvidenciaActual.alt = `Evidencia ${indiceEvidenciaActual + 1} del ticket`;
    contadorEvidencias.textContent = `${indiceEvidenciaActual + 1} de ${evidenciasActuales.length}`;

    const hayVarias = evidenciasActuales.length > 1;
    evidenciaAnterior.disabled = !hayVarias;
    evidenciaSiguiente.disabled = !hayVarias;

    miniaturasEvidencias.innerHTML = evidenciasActuales.map((url, indice) => `
        <button type="button" class="miniatura-evidencia ${indice === indiceEvidenciaActual ? "activa" : ""}"
            data-indice-evidencia="${indice}" aria-label="Ver evidencia ${indice + 1}">
            <img src="${url}" alt="">
        </button>
    `).join("");

    miniaturasEvidencias.querySelectorAll("[data-indice-evidencia]").forEach(function (miniatura) {
        miniatura.addEventListener("click", function () {
            indiceEvidenciaActual = Number(miniatura.dataset.indiceEvidencia);
            actualizarGaleriaEvidencias();
        });
    });
}

/* Después de la última foto vuelve a la primera */
function cambiarEvidencia(direccion) {
    if (evidenciasActuales.length < 2) return;
    indiceEvidenciaActual = (
        indiceEvidenciaActual + direccion + evidenciasActuales.length
    ) % evidenciasActuales.length;
    actualizarGaleriaEvidencias();
}

function llenarDialog(ticket) {
    document.getElementById("dialogIdTicket").value = ticket.idTicket;
    document.getElementById("dialogAsunto").textContent = ticket.asunto;
    document.getElementById("dialogCodigo").textContent = ticket.codigo;
    document.getElementById("dialogEstado").textContent = ticket.estado;
    document.getElementById("dialogTecnicoActual").textContent = ticket.tecnico;
    document.getElementById("dialogTipo").textContent = ticket.tipoTicket;
    document.getElementById("dialogUbicacion").textContent = ticket.ubicacion;
    document.getElementById("dialogDescripcion").textContent = ticket.descripcion;
    document.getElementById("sltPrioridad").value = ticket.prioridad;
    document.getElementById("fechaVencimiento").value = ticket.fechaVencimiento;
    document.getElementById("sltTecnico").value = ticket.idTecnicoAsignado;
    document.getElementById("sltDepartamentoDialog").value = ticket.idDepartamento;
    renderizarEvidencias(ticket.evidencias);
}

/* Busca el ticket por su id, llena la tarjeta y la abre como ventana modal */
function abrirDialog(idTicket) {
    const ticket = ticketsGestion.find(elemento => elemento.idTicket === idTicket);
    if (!ticket) return;

    idTicketSeleccionado = idTicket;
    llenarDialog(ticket);
    dialogAprobacion.classList.remove("cerrando");
    dialogAprobacion.showModal();
}

// Animación del dialog al cerrarse
function cerrarDialogConAnimacion() {
    if (!dialogAprobacion.open || dialogAprobacion.classList.contains("cerrando")) return;
    dialogAprobacion.classList.add("cerrando");
    window.setTimeout(function () {
        dialogAprobacion.close();
        dialogAprobacion.classList.remove("cerrando");
    }, 190);
}

cerrarDialog.addEventListener("click", cerrarDialogConAnimacion);

dialogAprobacion.addEventListener("click", function (evento) {
    if (evento.target === dialogAprobacion) cerrarDialogConAnimacion();
});

dialogAprobacion.addEventListener("cancel", function (evento) {
    evento.preventDefault();
    cerrarDialogConAnimacion();
});

evidenciaAnterior.addEventListener("click", function () { cambiarEvidencia(-1); });
evidenciaSiguiente.addEventListener("click", function () { cambiarEvidencia(1); });
cerrarVisorEvidencias.addEventListener("click", function () { visorEvidencias.close(); });

/* Al estar en el dialog y presionar el fondo cierra únicamente la galería, no el ticket */
visorEvidencias.addEventListener("click", function (evento) {
    if (evento.target === visorEvidencias) visorEvidencias.close();
});

formAprobacion.addEventListener("submit", function (evento) {
    evento.preventDefault();
    if (!formAprobacion.checkValidity()) {
        formAprobacion.reportValidity();
        return;
    }

    const solicitudAprobacion = Object.fromEntries(new FormData(formAprobacion).entries());

    void solicitudAprobacion;
});

rechazarTicket.addEventListener("click", function () {
    if (idTicketSeleccionado === null) return;

});

renderizarTickets();

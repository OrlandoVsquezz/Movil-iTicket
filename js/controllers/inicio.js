import { getIndicadoresEstadoPropios, getResumenSemanal, getTicketsPropios } from "../services/ticketsService.js";
import { iniciarTicketsStack } from "../components/common.js";
import { formatearFecha12H } from "../utils/formateadores.js";
import { getUsuarioId } from "../services/usuariosService.js";

const avatar = document.getElementById("imgPerfil");
const txtBienvenida = document.getElementById("txtBienvenida");
const btnEvaluaciones = document.getElementById("btnEvaluaciones");

const numNuevos = document.getElementById("numNuevos");
const numResueltos = document.getElementById("numResueltos");
const numCerrados = document.getElementById("numCerrados");
const numAsignados = document.getElementById("numAsignados");
const numEnProceso = document.getElementById("numEnProceso");
const numEnEspera = document.getElementById("numEnEspera");
const numVencidos = document.getElementById("numVencidos");

const ticketsStack = document.getElementById("ticketsStack");

const idUsuario = 1; //Temporal

document.addEventListener("DOMContentLoaded", () => {
    generarAvatarPerfil();
    cargarIndicadores(idUsuario);
    cargarGrafico(idUsuario);
    cargarTickets(idUsuario);
});

//Coloca la foto de perfil real si el usuario tiene una, o un avatar con inicial y fondo degradado si no
async function generarAvatarPerfil() {
    if (!avatar) return;

    const usuario = await obtenerUsuarioActual(idUsuario);
    const nombreUsuario = usuario.nombreUsuario;

    if (usuario.imagenUrl) {
        mostrarFotoPerfil(avatar, usuario.imagenUrl, nombreUsuario);
    } else {
        mostrarInicialPerfil(avatar, nombreUsuario);
    }
}

//Mientras no haya sesion real conectada, cae al nombre que ya esta escrito en el saludo como respaldo.
async function obtenerUsuarioActual(idUsuario) {
    try {
        const usuario = await getUsuarioId(idUsuario);

        if (usuario && usuario.nombreUsuario) {
            // Extrae la primera palabra (primer nombre)
            const primerNombre = usuario.nombreUsuario.trim().split(' ')[0];

            txtBienvenida.innerHTML = `
                <span>Hola, ${primerNombre}</span> <span class="saludo-emoji">👋</span>
            `;

            return usuario;

        } else {
            const nombreDelSaludo = txtBienvenida?.querySelector("span")?.textContent?.replace("Hola,", "").trim();

            return { nombreUsuario: nombreDelSaludo || null, imagenUrl: null };
        }

    } catch (error) {
        console.error("Error al obtener el usuario:", error);
    }

}

function mostrarFotoPerfil(avatarActual, imagenUrl, nombreUsuario) {
    const img = document.createElement("img");
    img.src = imagenUrl;
    img.alt = `Foto de perfil de ${nombreUsuario}`;
    img.className = "saludo-avatar";
    avatarActual.replaceWith(img);
}

function mostrarInicialPerfil(avatarActual, nombreUsuario) {
    const inicial = nombreUsuario.trim().charAt(0).toUpperCase() || "?";

    const div = document.createElement("div");
    div.className = "saludo-avatar saludo-avatar-inicial";
    div.textContent = inicial;
    div.setAttribute("role", "img");
    div.setAttribute("aria-label", `Foto de perfil de ${nombreUsuario}`);
    div.style.background = generarDegradadoAzul();

    avatarActual.replaceWith(div);
}

//azul aleatorio distinto en cada carga
function generarDegradadoAzul() {
    const tonoBase = Math.floor(Math.random() * (240 - 210 + 1)) + 210;
    const tonoSecundario = tonoBase + 15;
    const color1 = `hsl(${tonoBase}, 85%, 35%)`;
    const color2 = `hsl(${tonoSecundario}, 85%, 20%)`;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
}

//Cargar y mostrar indicadores de estado de tickets
async function cargarIndicadores(idUsuario) {
    try {
        const indicadores = await getIndicadoresEstadoPropios(idUsuario);

        numNuevos.textContent = indicadores.nuevos;
        numResueltos.textContent = indicadores.resueltos;
        numCerrados.textContent = indicadores.cerrados;
        numAsignados.textContent = indicadores.asignados;
        numEnProceso.textContent = indicadores.enProgreso;
        numEnEspera.textContent = indicadores.enEspera;
        numVencidos.textContent = indicadores.vencidos;

        if (indicadores.resueltos === 0) {
            btnEvaluaciones.classList.add("d-none");
        } else {
            btnEvaluaciones.classList.remove("d-none");
        }
    } catch (error) {
        console.error("Error al cargar indicadores de estado: ", error);
    }
}

//Cargar datos del gráfico 
async function cargarGrafico(idUsuario) {
    const resumen = await getResumenSemanal(idUsuario);
    const valores = resumen.map(d => d.cantidad);
    const maximo = Math.max(5, ...valores);

    document.querySelectorAll(".barra").forEach((barra, i) => {
        barra.style.setProperty("--valor", valores[i]);
    });
    document.querySelector(".grafico-tickets").style.setProperty("--max", maximo);

    //Reescribe las 5 etiquetas del eje según el máximo real
    const eje = document.querySelectorAll(".grafico-eje span");
    [maximo, maximo * 0.75, maximo * 0.5, maximo * 0.25, 0].forEach((v, i) => {
        eje[i].textContent = Math.round(v);
    });
}

//Cargar targetas de tickets
async function cargarTickets(idUsuario) {
    if (!ticketsStack) return;
    try {
        const resultado = await getTicketsPropios(idUsuario, 1, 5);
        const tickets = resultado.tickets;

        if (!tickets || tickets.length === 0) {
            ticketsStack.innerHTML = `<p class="text-muted">Aún no tienes tickets.</p>`;
            return;
        }

        ticketsStack.innerHTML = tickets.map(renderizarTargetaTicket).join("");
        iniciarTicketsStack(ticketsStack);//Para enlazar los clicks con las targetas y que funcione la animacion
    } catch (error) {
        console.error("Error al cargar los últimos tickets:", error);
    }
}

function renderizarTargetaTicket(ticket) {

    const prio = ticket.prioridad || '';
    const fechaVencimiento = ticket.fechaVencimiento || '';

    return `
        <article class="ticket-card" data-url="ticket.html?id=${ticket.idTicket}">
            <header class="ticket-header">
                <div class="ticket-title-group">
                    <i class="bi bi-ticket-perforated bi-${prio} me-2"></i>
                    <span class="dot">•</span>
                    <h2 class="ticket-title texto-limitado-2">${ticket.asunto}</h2>
                </div>
                <div class="header-actions">
                    <img src="img/Mensaje.png" alt="Chat" class="chat-icon">
                    <span class="badge prioridad-${prio}">${prio}</span>
                </div>
            </header>
            <div class="ticket-details">
                <p class="ticket-code">${ticket.codigo}</p>
                <p class="ticket-info"><strong>Estado:</strong> ${ticket.estado}</p>
                <p class="ticket-info"><strong>Creado:</strong> ${formatearFecha12H(ticket.fechaCreacion)}</p>
                ${ticket.fechaVencimiento ? `<p class="ticket-info"><strong>Vence:</strong> ${formatearFecha12H(ticket.fechaVencimiento)}</p> ` : ''}
            </div>
            <div class="ticket-description">
                <p class="description-title">Descripción:</p>
                <p class="description-text texto-limitado">${ticket.descripcion}</p>
            </div>
        </article>
    `;
}
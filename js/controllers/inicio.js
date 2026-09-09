import {
    getIndicadoresEstadoPropios,
    getResumenSemanal,
    getTicketsPendientesEvaluacion,
    getTicketsPropios
} from "../services/ticketsService.js";
import { iniciarTicketsStack } from "../components/common.js";
import { formatearFecha12H } from "../utils/formateadores.js";
import { getUsuarioId } from "../services/usuariosService.js";
import { mostrarError } from "../components/notificacionesUI.js";
import { obtenerIdUsuario } from "../utils/sesion.js";

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

const idUsuario = obtenerIdUsuario();

document.addEventListener("DOMContentLoaded", () => {
    generarAvatarPerfil();
    cargarIndicadores(idUsuario);
    cargarGrafico(idUsuario);
    cargarTickets(idUsuario);
    cargarEvaluacionPendiente(idUsuario);
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
                <span>Hola, ${primerNombre}</span>
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
    img.className = "saludo-avatar saludo-avatar-real";
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

    } catch (error) {
        console.error("Error al cargar indicadores de estado: ", error);
    }
}

// Muestra la estrella cuando hay una evaluación pendiente.
async function cargarEvaluacionPendiente(idUsuarioActual) {
    if (!btnEvaluaciones) return;

    btnEvaluaciones.classList.add("d-none");
    btnEvaluaciones.removeAttribute("data-id-ticket");

    try {
        const resultado = await getTicketsPendientesEvaluacion(idUsuarioActual);
        const ticketPendiente = resultado?.tickets?.[0];
        if (!ticketPendiente) return;

        btnEvaluaciones.dataset.idTicket = ticketPendiente.idTicket;
        btnEvaluaciones.classList.remove("d-none");
    } catch (error) {
        console.error("Error al consultar evaluaciones pendientes:", error);
    }
}

btnEvaluaciones?.addEventListener("click", () => {
    const idTicket = Number(btnEvaluaciones.dataset.idTicket);
    if (!idTicket) return;
    window.location.href = `evaluacionPendiente.html?id=${idTicket}`;
});

//Cargar datos del gráfico
async function cargarGrafico(idUsuario) {
    try {
        const resumen = await getResumenSemanal(idUsuario);
        const valores = Array.from({ length: 7 }, (_, indice) => Number(resumen[indice]?.cantidad) || 0);
        const maximo = Math.max(5, ...valores);

        document.querySelectorAll(".barra").forEach((barra, indice) => {
            barra.style.setProperty("--valor", valores[indice]);
        });
        document.querySelector(".grafico-tickets").style.setProperty("--max", maximo);

        //Reescribe las 5 etiquetas del eje según el máximo real
        const eje = document.querySelectorAll(".grafico-eje span");
        [maximo, maximo * 0.75, maximo * 0.5, maximo * 0.25, 0].forEach((v, i) => {
            eje[i].textContent = Math.round(v);
        });
    }catch (error) {
        console.error("Error al obtener el resumen semanal:", error);
        mostrarError("Error al obtener el resumen semanal")
    }
}


//Cargar targetas de tickets
async function cargarTickets(idUsuario) {
    if (!ticketsStack) return;
    try {
        const resultado = await getTicketsPropios(idUsuario, 1, 5);
        // Inicio solo enseña los cinco tickets más recientes.
        const tickets = [...(resultado.tickets || [])]
            .sort((a, b) => {
                const fechaA = Date.parse(a.fechaCreacion || '') || 0;
                const fechaB = Date.parse(b.fechaCreacion || '') || 0;
                return fechaB - fechaA || Number(b.idTicket || 0) - Number(a.idTicket || 0);
            })
            .slice(0, 5);

        if (!tickets || tickets.length === 0) {
            ticketsStack.innerHTML = `<p class="text-muted">Aún no tienes tickets.</p>`;
            return;
        }

        ticketsStack.innerHTML = tickets.map(renderizarTargetaTicket).join("");
        iniciarTicketsStack(ticketsStack);//Para enlazar los clicks con las targetas y que funcione la animacion
    } catch (error) {
        console.error("Error al cargar los últimos tickets:", error);
        mostrarError("Error al cargar los tickets")
    }
}

function renderizarTargetaTicket(ticket) {

    const prio = ticket.prioridad || '';
    const fechaVencimiento = ticket.fechaVencimiento || '';

    return `
        <article class="ticket-card" data-url="vistaTicket.html?id=${ticket.idTicket}">
            <header class="ticket-header">
                <div class="ticket-title-group">
                    <i class="bi bi-ticket-perforated bi-${prio} me-2"></i>
                    <span class="dot">•</span>
                    <h2 class="ticket-title texto-limitado-2">${ticket.asunto}</h2>
                </div>
                <div class="header-actions">
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

import { getTicketsPropios } from "../services/ticketsService.js";
import { formatearFecha12H } from "../utils/formateadores.js";
import { iniciarTicketsStack, renderizarPaginacion as pintarPaginacionComun } from "../components/common.js";
import { mostrarError } from "../components/notificacionesUI.js";
import { obtenerIdUsuario } from "../utils/sesion.js";

const ticketsStack = document.getElementById("ticketsStack");
const paginacionTickets = document.getElementById("paginacionTickets");
const infoTickets = document.getElementById("infoTickets");

const filtrosWrapper = document.querySelectorAll(".filter-wrapper");
const txtBuscar = document.getElementById("txtBuscar");
const btnFecha = document.getElementById("btnFecha");
const inputFecha = document.getElementById("inputFecha");

let paginaActualTickets = 1;
let filtrosActuales = {};
let temporizadorBusqueda = null;
const cerrarSelectorInterfaz = () => document.getElementById("selectorInterfaz")?._cerrarSelector?.();

const idUsuario = obtenerIdUsuario();

document.addEventListener("DOMContentLoaded", () => {
    cargarTickets(idUsuario);
    //Para que los filtros tengan un texto predeterminado
    document.querySelectorAll(".filter-button[data-filtro] .filter-text").forEach((span) => {
        span.dataset.textoDefault = span.textContent;
    });
});

document.addEventListener("click", () =>
    cerrarPaneles()
);

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    const panelAbierto = document.querySelector(".filter-panel.abierto");
    if (!panelAbierto) return;

    const boton = panelAbierto.closest(".filter-wrapper")?.querySelector(".filter-button, .notificaciones");
    cerrarPaneles();
    boton?.focus();
});

//Cargar targetas de tickets
async function cargarTickets(idUsuario, pagina = 1) {
    if (!ticketsStack) return;
    try {
        const resultado = await getTicketsPropios(idUsuario, pagina, 5, filtrosActuales);
        const tickets = resultado.tickets;

        infoTickets.classList.remove("d-none");
        paginacionTickets.classList.remove("d-none");

        if (!tickets || tickets.length === 0) {
            ticketsStack.innerHTML = `<div class="justify-content-center text-center">
                <p class="text-muted justify-content-center">No se encontraron tickets.</p> 
                <img src="img/SinResultados.svg" alt="Sin resultados"></img>
            </div>
            `;
            infoTickets.classList.add("d-none");
            paginacionTickets.classList.add("d-none");
            return;
        }

        paginaActualTickets = resultado.paginaActual;
        ticketsStack.innerHTML = tickets.map(renderizarTargetaTicket).join("");
        iniciarTicketsStack(ticketsStack);//Para enlazar los clicks con las targetas y que funcione la animacion
        renderizarPaginacion(resultado.totalPaginas, resultado.paginaActual);
        const inicio = (resultado.paginaActual - 1) * 5 + 1;
        const fin = inicio + resultado.tickets.length - 1;
        infoTickets.textContent = `Mostrando ${inicio}-${fin} de ${resultado.totalElementos}`;

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

function renderizarPaginacion(totalPaginas, paginaActual) {
    pintarPaginacionComun(paginacionTickets, paginaActual, totalPaginas, (pagina) => {
        cargarTickets(idUsuario, pagina);
    });
}

//Filtros y búsqueda
txtBuscar.addEventListener("input", () => {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(() => {
        filtrosActuales.busqueda = txtBuscar.value.trim();
        cargarTickets(idUsuario, 1);
    }, 400);
});

//Escucha los 2 paneles de filtros
document.querySelectorAll("#panelPrioridad .filter-opcion, #panelEstado .filter-opcion").forEach((opcion) => {
    opcion.addEventListener("click", () => {
        const panel = opcion.closest(".filter-panel");
        const wrapper = opcion.closest(".filter-wrapper");
        const boton = wrapper.querySelector(".filter-button");
        const tipoFiltro = boton.dataset.filtro; // "prioridad" o "estado", según el botón
        const textoEl = boton.querySelector(".filter-text");

        panel.querySelectorAll(".filter-opcion").forEach((o) => o.classList.remove("seleccionada"));
        opcion.classList.add("seleccionada");

        //Si valor es "", no se selecciona nada y se pone el texto por defecto
        const valor = opcion.dataset.valor;
        textoEl.textContent = valor || textoEl.dataset.textoDefault;
        filtrosActuales[tipoFiltro] = valor;

        cerrarPaneles();
        cargarTickets(idUsuario, 1);
    });
});

//Al tocar el filtro e fecha se dispara el picker del input
btnFecha.addEventListener("click", (e) => {
    e.stopPropagation();
    inputFecha.showPicker();
});

inputFecha.addEventListener("change", () => {
    const textoEl = btnFecha.querySelector(".filter-text");
    textoEl.textContent = inputFecha.value || textoEl.dataset.textoDefault || "Fecha";
    filtrosActuales.fecha = inputFecha.value;
    cargarTickets(idUsuario, 1);
});

// Paneles de prioridad y estado.
function cerrarPaneles(panelActual = null) {
    document.querySelectorAll(".filter-panel.abierto").forEach((panel) => {
        if (panel === panelActual) return;

        panel.classList.remove("abierto");
        const wrapper = panel.closest(".filter-wrapper");
        wrapper?.classList.remove("menu-abierto");
        wrapper?.querySelector(".filter-button, .notificaciones")?.setAttribute("aria-expanded", "false");
    });
}

filtrosWrapper.forEach((wrapper) => {
    const boton = wrapper.querySelector(".filter-button, .notificaciones");
    const panel = wrapper.querySelector(".filter-panel");
    if (!boton || !panel) return;

    //Al dar click en un panel, se cierran todos los demas y solo se abre el actual
    boton.addEventListener("click", (e) => {
        e.stopPropagation(); //Para que el click no se propague hasta el document y se cierre a si mismo
        const abierto = panel.classList.contains("abierto");
        cerrarSelectorInterfaz();
        cerrarPaneles();

        if (!abierto) {
            panel.classList.add("abierto");
            wrapper.classList.add("menu-abierto");
        }

        boton.setAttribute("aria-expanded", String(!abierto));
    });
});

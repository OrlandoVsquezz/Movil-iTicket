import { getTicketsPropios } from "../services/ticketsService.js";
import { formatearFecha12H } from "../utils/formateadores.js";
import { iniciarTicketsStack } from "../components/common.js";
import { mostrarError } from "../components/sweetAlerts.js";
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
        renderizarPaginacion(resultado.totalPaginas, resultado.paginaActual)
        infoTickets.textContent = `${resultado.tickets.length}/${resultado.totalElementos}`;

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

//Arma la lista de páginas a mostrar: siempre primera y última, un rango alrededor de la actual, y "..." donde haya un salto entre esos números
function construirRangoPaginas(totalPaginas, paginaActual, vecinos = 1) {
    //La primera y ultima pagina siempre se incluyen, el set no permite valores repetidos, asi que si el total es 1, solo lo ignora
    const paginas = new Set([1, totalPaginas]);

    for (let i = paginaActual - vecinos; i <= paginaActual + vecinos; i++) {
        if (i >= 1 && i <= totalPaginas) paginas.add(i); //Descarta los valores fuera de rango
    }

    //Ordena los indices de paginas
    const ordenadas = [...paginas].sort((a, b) => a - b);

    //Compara cada numero de pagina con el que acaba de poner
    const rango = [];
    let anterior = null;
    for (const pagina of ordenadas) {
        //Si la diferencia es mayor a 1, significa que hay paginas saltadas y se agregan ... en lugar de un numero
        if (anterior !== null && pagina - anterior > 1) {
            rango.push("...");
        }
        rango.push(pagina);
        anterior = pagina;
    }
    return rango;
}

function renderizarPaginacion(totalPaginas, paginaActual) {
    paginacionTickets.innerHTML = "";

    construirRangoPaginas(totalPaginas, paginaActual).forEach((pagina) => {
        if (pagina === "...") {
            paginacionTickets.innerHTML += `
                <li class="page-item disabled">
                    <span class="page-link border-0 bg-transparent text-dark">…</span>
                </li>
            `;
            return;
        }

        const activo = pagina === paginaActual ? "active" : "";
        paginacionTickets.innerHTML += `
            <li class="page-item ${activo}">
                <a class="page-link border-0 bg-transparent text-dark" href="#" data-pagina="${pagina}">${pagina}</a>
            </li>
        `;
    });
}

paginacionTickets.addEventListener("click", (e) => {
    const link = e.target.closest("[data-pagina]");
    if (!link) return;
    e.preventDefault();
    cargarTickets(idUsuario, Number(link.dataset.pagina));
});

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
    textoEl.textContent = inputFecha.value || textoEl.dataset.textoDefault;
    filtrosActuales.fecha = inputFecha.value;
    cargarTickets(idUsuario, 1);
});

//Manejo de paneles para cambiar de interfaz y filtros
function cerrarPaneles(panelActual = null) {
    document.querySelectorAll(".filter-panel.abierto").forEach((panel) => {
        if (panel !== panelActual) panel.classList.remove("abierto");
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
        cerrarPaneles();
        if (!abierto) panel.classList.add("abierto");
    });
});
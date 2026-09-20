import { obtenerRolUsuario } from "../utils/sesion.js";

/* Cada interfaz indica qué roles pueden entrar. Un usuario normal solo tiene "Mis tickets",
   así que no se le muestra el selector. */
const INTERFACES = [
    { archivo: "misTickets.html", etiqueta: "Mis Tickets", icono: "bi-ticket-perforated", roles: ["admin", "tecnico", "usuario"] },
    { archivo: "gestionTickets.html", etiqueta: "Gestión", icono: "bi-ticket-detailed", roles: ["admin"] },
    { archivo: "ticketsAsignados.html", etiqueta: "Tickets Asignados", icono: "bi-person-check", roles: ["admin", "tecnico"] },
    { archivo: "proyectos.html", etiqueta: "Proyectos", icono: "bi-kanban", roles: ["admin", "tecnico"] },
];

function interfacesDelRol() {
    const rol = obtenerRolUsuario();
    return INTERFACES.filter((interfaz) => interfaz.roles.includes(rol));
}

function obtenerPaginaActual() {
    return window.location.pathname.split("/").pop().toLowerCase();
}

function crearContenidoSelector(paginaActual) {
    const opciones = interfacesDelRol().map(({ archivo, etiqueta, icono }) => {
        const seleccionada = paginaActual === archivo.toLowerCase();
        return `
            <a href="${archivo}" class="opcion-interfaz${seleccionada ? " seleccionada" : ""}"
                role="menuitem"${seleccionada ? ' aria-current="page"' : ""} tabindex="-1">
                <span class="espacio-icono"><i class="bi ${icono}" aria-hidden="true"></i></span>
                <span>${etiqueta}</span>
            </a>`;
    }).join("");

    return `
        <div class="panel-interfaz" id="panelInterfaz" role="menu" aria-label="Cambiar interfaz"
            aria-hidden="true">
            ${opciones}
        </div>
        <button type="button" class="cambioInterfaz" id="cambioInterfaz" aria-label="Cambiar interfaz"
            aria-haspopup="menu" aria-expanded="false" aria-controls="panelInterfaz">
            <img src="img/cambioInterfaz.png" alt="" class="imgCambioInterfaz">
        </button>`;
}

export function iniciarSelectorInterfaz(selector = document.getElementById("selectorInterfaz")) {
    if (!selector) return;

    // Con una sola interfaz disponible (el caso de los usuarios) no hay nada que elegir
    if (interfacesDelRol().length <= 1) {
        selector.innerHTML = "";
        selector.hidden = true;
        return;
    }
    selector.hidden = false;

    if (selector._iticketSelectorController) selector._iticketSelectorController.abort();
    const controller = new AbortController();
    const { signal } = controller;
    selector._iticketSelectorController = controller;

    const paginaActiva = (selector.dataset.interfaz || obtenerPaginaActual()).toLowerCase();
    selector.innerHTML = crearContenidoSelector(paginaActiva);

    // El panel crece según las opciones del rol: 26px de relleno + 41px por opción + 3px entre ellas
    const totalOpciones = interfacesDelRol().length;
    selector.style.setProperty("--alto-panel-interfaz", `${26 + totalOpciones * 41 + (totalOpciones - 1) * 3}px`);

    const boton = selector.querySelector("#cambioInterfaz");
    const panel = selector.querySelector("#panelInterfaz");
    const opciones = [...selector.querySelectorAll(".opcion-interfaz")];

    const cambiarEstado = (abrir) => {
        selector.classList.toggle("abierto", abrir);
        boton.setAttribute("aria-expanded", String(abrir));
        panel.setAttribute("aria-hidden", String(!abrir));
        opciones.forEach((opcion) => opcion.setAttribute("tabindex", abrir ? "0" : "-1"));
        if (abrir) opciones.find((opcion) => opcion.classList.contains("seleccionada"))?.focus();
    };

    selector._cerrarSelector = () => cambiarEstado(false);

    cambiarEstado(false);

    boton.addEventListener("click", (evento) => {
        evento.stopPropagation();
        const abrir = !selector.classList.contains("abierto");
        document.querySelectorAll(".filter-panel.abierto").forEach((filtro) => filtro.classList.remove("abierto"));
        cambiarEstado(abrir);
    }, { signal });

    opciones.forEach((opcion) => {
        opcion.addEventListener("click", () => cambiarEstado(false), { signal });
    });

    document.addEventListener("click", (evento) => {
        if (!selector.contains(evento.target)) cambiarEstado(false);
    }, { signal, capture: true });

    document.addEventListener("keydown", (evento) => {
        if (evento.key !== "Escape" || !selector.classList.contains("abierto")) return;
        cambiarEstado(false);
        boton.focus();
    }, { signal });
}

function iniciar() {
    document.querySelectorAll(".selector-interfaz").forEach((selector) => iniciarSelectorInterfaz(selector));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar, { once: true });
else iniciar();

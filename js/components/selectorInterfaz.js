const INTERFACES = [
    { archivo: "misTickets.html", etiqueta: "Mis Tickets", icono: "bi-ticket-perforated" },
    { archivo: "ticketsAsignados.html", etiqueta: "Tickets Asignados", icono: "bi-ticket-detailed" },
    { archivo: "gestionTickets.html", etiqueta: "Gestión", icono: "bi-bar-chart" },
    { archivo: "proyectos.html", etiqueta: "Proyectos", icono: "bi-gear" }
];

function obtenerPaginaActual() {
    return window.location.pathname.split("/").pop().toLowerCase();
}

function crearContenidoSelector(paginaActual) {
    const opciones = INTERFACES.map(({ archivo, etiqueta, icono }) => {
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

    if (selector._iticketSelectorController) selector._iticketSelectorController.abort();
    const controller = new AbortController();
    const { signal } = controller;
    selector._iticketSelectorController = controller;

    const paginaActiva = (selector.dataset.interfaz || obtenerPaginaActual()).toLowerCase();
    selector.innerHTML = crearContenidoSelector(paginaActiva);

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

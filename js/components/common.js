import {
  obtenerIdRol,
  obtenerUsuarioLogueado,
  paginaTicketsPorRol,
  ROLES
} from "../utils/sesion.js";

function posicionarTarjetas(cards, indiceActivo, alturaAbierta) {
  let y = 0;
  cards.forEach((card, i) => {
    //Asignar la posición Y actual antes de evaluar el desplazamiento
    card.style.setProperty('--offset', `${y}px`);

    //Calcular el offset de la siguiente tarjeta
    if (indiceActivo === null) {
      //Estado colapsado inicial
      y += 65;
    } else {
      if (i < indiceActivo) {
        //Las tarjetas anteriores se quedan en su lugar original
        y += 65;
      } else if (i === indiceActivo) {
        //La tarjeta activa se expande y empuja solo a las que están debajo de ella
        y += alturaAbierta;
      } else {
        //Las tarjetas posteriores mantienen la separación habitual entre sí
        y += 65;
      }
    }
  });

  //Se recalcula la altura minima del contenedor de los tickets para que la ultima targeta no se sobreponga a otros elementos
  const ultima = cards[cards.length - 1];
  if (ultima) {
    const stack = ultima.closest('.tickets-stack');
    if (stack) {
      const offsetUltima = parseFloat(ultima.style.getPropertyValue('--offset')) || 0;
      stack.style.minHeight = `${offsetUltima + ultima.scrollHeight}px`;
    }
  }
}

export function iniciarTicketsStack(stack) {
  if (!stack) return;
  const cards = stack.querySelectorAll('.ticket-card');
  posicionarTarjetas(cards, null, 0);

  cards.forEach((card, index) => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('chat-icon')) {
        e.stopPropagation();
        const url = card.getAttribute('data-url');
        if (url) window.location.href = url;
        return;
      }
      if (card.classList.contains('is-active')) {
        const url = card.getAttribute('data-url');
        if (url) window.location.href = url;
        return;
      }
      cards.forEach(c => c.classList.remove('is-active'));
      card.classList.add('is-active');
      posicionarTarjetas(cards, index, card.scrollHeight + 20);
    });
  });

  //Retraer los tickets al hacer click afuera
  document.addEventListener('click', (e) => {
    if (!stack.contains(e.target)) {
      cards.forEach(c => c.classList.remove('is-active'));
      posicionarTarjetas(cards, null, 0);
    }
  });
}


document.addEventListener('DOMContentLoaded', () => {
  if (!configurarInterfazPorRol()) return;
  desconectarNotificaciones();
  iniciarTicketsStack(document.getElementById('ticketsStack'));
});

const RUTAS_POR_ROL = Object.freeze({
  "gestiontickets.html": [ROLES.ADMINISTRADOR],
  "ticketsasignados.html": [ROLES.ADMINISTRADOR, ROLES.TECNICO],
  "proyectos.html": [ROLES.ADMINISTRADOR, ROLES.TECNICO],
  "vistaproyecto.html": [ROLES.ADMINISTRADOR, ROLES.TECNICO],
  "evaluaciones.html": [ROLES.ADMINISTRADOR, ROLES.TECNICO]
});

function obtenerPaginaActual() {
  const segmentos = window.location.pathname.split("/");
  return decodeURIComponent(segmentos.at(-1) || "").toLowerCase();
}

function redirigirSiNoTieneAcceso(idRol) {
  const rolesPermitidos = RUTAS_POR_ROL[obtenerPaginaActual()];
  if (!rolesPermitidos || rolesPermitidos.includes(idRol)) return true;

  window.location.replace(paginaTicketsPorRol(idRol));
  return false;
}

function configurarEnlacesNavegacion(idRol) {
  const rutas = {
    inicio: "inicio.html",
    tickets: paginaTicketsPorRol(idRol),
    agregar: "crearTicket.html",
    mensajes: "chatbot.html",
    perfil: "perfil.html"
  };

  document.querySelectorAll(".bottom-nav .nav-item").forEach((enlace) => {
    const etiqueta = (enlace.getAttribute("aria-label") || "").toLowerCase();

    if (etiqueta.includes("inicio")) enlace.href = rutas.inicio;
    else if (etiqueta.includes("ticket") && !etiqueta.includes("crear")) enlace.href = rutas.tickets;
    else if (enlace.classList.contains("fab-item") || etiqueta.includes("agregar") || etiqueta.includes("crear")) enlace.href = rutas.agregar;
    else if (etiqueta.includes("mensaje")) enlace.href = rutas.mensajes;
    else if (etiqueta.includes("perfil")) enlace.href = rutas.perfil;
  });
}

function configurarSelectorDeInterfaces(idRol) {
  const puedeCambiarInterfaz = idRol === ROLES.ADMINISTRADOR || idRol === ROLES.TECNICO;

  document.querySelectorAll("button").forEach((boton) => {
    const imagen = boton.querySelector("img");
    const origen = imagen?.getAttribute("src")?.toLowerCase() || "";
    const esCambio = origen.includes("cambiar.png") || origen.includes("cambiointerfaz.png") ||
      boton.getAttribute("aria-label")?.toLowerCase() === "cambiar interfaz";
    if (!esCambio) return;

    const contenedor = boton.closest(".filter-wrapper, .selector-interfaz") || boton;
    contenedor.hidden = !puedeCambiarInterfaz;
    contenedor.setAttribute("aria-hidden", String(!puedeCambiarInterfaz));
  });

  document.querySelectorAll('a[href="gestionTickets.html"]').forEach((opcion) => {
    opcion.hidden = idRol !== ROLES.ADMINISTRADOR;
    opcion.setAttribute("aria-hidden", String(idRol !== ROLES.ADMINISTRADOR));
  });

  // Esta variante del selector usa botones en lugar de enlaces.
  document.querySelectorAll(".opcion-interfaz").forEach((opcion) => {
    const interfaz = opcion.dataset.interfaz;
    if (interfaz === "estadisticas") {
      // La aplicación móvil todavía no contiene esa vista; no se deja un botón muerto.
      opcion.hidden = true;
      return;
    }

    opcion.addEventListener("click", () => {
      if (interfaz === "tickets") window.location.href = paginaTicketsPorRol(idRol);
      if (interfaz === "evaluaciones") window.location.href = "evaluaciones.html";
    });
  });

  const selector = document.getElementById("selectorInterfaz");
  const panel = document.getElementById("panelInterfaz");
  const boton = document.getElementById("cambioInterfaz");
  if (selector && panel && boton && puedeCambiarInterfaz) {
    selector.classList.add("filter-wrapper");
    panel.classList.add("filter-panel");
    panel.style.left = "auto";
    panel.style.right = "0";
    boton.classList.add("notificaciones");
    boton.querySelector("img")?.classList.add("imgNotificaciones");
    panel.querySelectorAll(".opcion-interfaz").forEach((opcion) => opcion.classList.add("filter-opcion"));
    panel.setAttribute("aria-hidden", "true");

    boton.addEventListener("click", (evento) => {
      evento.stopPropagation();
      const abierto = panel.classList.toggle("abierto");
      boton.setAttribute("aria-expanded", String(abierto));
      panel.setAttribute("aria-hidden", String(!abierto));
    });

    document.addEventListener("click", (evento) => {
      if (selector.contains(evento.target)) return;
      panel.classList.remove("abierto");
      boton.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");
    });
  }
}

function configurarInterfazPorRol() {
  const usuario = obtenerUsuarioLogueado();
  const idRol = obtenerIdRol();

  if (!usuario || !Object.values(ROLES).includes(idRol)) {
    window.location.replace("index.html");
    return false;
  }

  if (!redirigirSiNoTieneAcceso(idRol)) return false;

  configurarEnlacesNavegacion(idRol);
  configurarSelectorDeInterfaces(idRol);
  return true;
}

function desconectarNotificaciones() {
  const NOTIFICACIONES_HABILITADAS = false;
  if (NOTIFICACIONES_HABILITADAS) return;

  document.querySelectorAll('a[href="notificaciones.html"], .notificaciones-no-individual').forEach(elemento => {
    elemento.hidden = true;
    elemento.setAttribute('aria-hidden', 'true');
  });

  document.querySelectorAll('button.notificaciones').forEach(boton => {
    const imagen = boton.querySelector('img');
    if (imagen?.getAttribute('src')?.toLowerCase().includes('notificaciones.png')) {
      boton.hidden = true;
      boton.setAttribute('aria-hidden', 'true');
    }
  });

  document.querySelectorAll('.card-opcion').forEach(opcion => {
    if (opcion.textContent.toLowerCase().includes('notificaciones activadas')) {
      opcion.hidden = true;
      opcion.setAttribute('aria-hidden', 'true');
    }
  });

  if (obtenerPaginaActual() === "gestiontickets.html") {
    const wrapper = document.querySelector(".filter-wrapper");
    const boton = wrapper?.querySelector(".notificaciones");
    const panel = wrapper?.querySelector(".filter-panel");
    if (boton && panel) {
      boton.addEventListener("click", (evento) => {
        evento.stopPropagation();
        panel.classList.toggle("abierto");
      });
      document.addEventListener("click", (evento) => {
        if (!wrapper.contains(evento.target)) panel.classList.remove("abierto");
      });
    }
  }
}

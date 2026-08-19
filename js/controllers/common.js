// Espera a que el HTML esté construido antes de buscar las tarjetas.
document.addEventListener('DOMContentLoaded', () => {
  // ticketsStack es el contenedor que agrupa las tarjetas superpuestas.
  const stack = document.getElementById('ticketsStack');

  // common.js se usa en varias páginas. Si una página no tiene ticketsStack,
  // se detiene únicamente esta funcionalidad para evitar errores.
  if (!stack) return;

  // Selecciona solo las tarjetas que pertenecen a esta pila.
  const cards = stack.querySelectorAll('.ticket-card');

  // Devuelve todas las tarjetas a su posición inicial y elimina el estado abierto.
  const resetStack = () => {
    cards.forEach(c => c.classList.remove('is-active'));
    stack.className = 'tickets-stack';
  };

  // index indica la posición de la tarjeta: 0 es la primera, 1 la segunda, etc.
  cards.forEach((card, index) => {
    card.addEventListener('click', (e) => {
      // El icono de chat tiene una acción independiente. stopPropagation evita
      // que su clic también active o expanda la tarjeta completa.
      if (e.target.classList.contains('chat-icon')) {
        e.stopPropagation();
        const url = card.getAttribute('data-url');
        if (url) window.location.href = url;
        return;
      }

      // is-active permite distinguir entre el primer y el segundo clic.
      const isActive = card.classList.contains('is-active');

      // Si la tarjeta ya estaba abierta, el segundo clic navega a data-url.
      if (isActive) {
        const url = card.getAttribute('data-url');
        if (url) window.location.href = url;
        return;
      }

      // Antes de abrir una tarjeta se cierra cualquier otra que estuviera activa.
      resetStack();

      // is-active marca la tarjeta elegida. active-N indica al CSS cuál de las
      // tarjetas debe separarse; por ejemplo, active-1 corresponde a la segunda.
      card.classList.add('is-active');
      stack.classList.add('has-active', `active-${index}`);

      // scrollHeight obtiene la altura real del contenido. La variable CSS
      // --open-height se usa para mover las tarjetas siguientes sin superponerlas.
      const height = card.scrollHeight + 20;
      stack.style.setProperty('--open-height', `${height}px`);
    });
  });

  // Retrae la pila cuando se hace clic en cualquier lugar fuera de ella.
  document.addEventListener('click', (e) => {
    if (!stack.contains(e.target)) {
      resetStack();
    }
  });
});

// Boton de cambio de interfaces 
const selectorInterfaz = document.getElementById("selectorInterfaz");
const cambioInterfaz = document.getElementById("cambioInterfaz");
const opcionesInterfaz = document.querySelectorAll(".opcion-interfaz");

function cambiarEstadoSelector(abrir) {
    if (!selectorInterfaz || !cambioInterfaz) return;

    selectorInterfaz.classList.toggle("abierto", abrir);
    cambioInterfaz.setAttribute("aria-expanded", String(abrir));

    const panelInterfaz = document.getElementById("panelInterfaz");
    if (panelInterfaz) {
        panelInterfaz.setAttribute("aria-hidden", String(!abrir));
    }
}

if (cambioInterfaz && selectorInterfaz) {
    cambioInterfaz.addEventListener("click", function () {
        const estaAbierto = selectorInterfaz.classList.contains("abierto");
        cambiarEstadoSelector(!estaAbierto);
    });
}

opcionesInterfaz.forEach(function (opcion) {
    opcion.addEventListener("click", function () {
        opcionesInterfaz.forEach(function (elemento) {
            elemento.classList.remove("seleccionada");
        });

        opcion.classList.add("seleccionada");

        const interfazSeleccionada = opcion.dataset.interfaz;
        console.log("Interfaz seleccionada:", interfazSeleccionada);

        cambiarEstadoSelector(false);
    });
});

document.addEventListener("click", function (evento) {
    if (selectorInterfaz && !selectorInterfaz.contains(evento.target)) {
        cambiarEstadoSelector(false);
    }
});

document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") {
        cambiarEstadoSelector(false);
        if (cambioInterfaz) cambioInterfaz.focus();
    }
});

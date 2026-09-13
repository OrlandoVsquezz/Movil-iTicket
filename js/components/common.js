function posicionarTarjetas(cards, indiceActivo, alturaAbierta) {
  let y = 0;
  cards.forEach((card, i) => {
    card.style.setProperty('--offset', `${y}px`);

    if (indiceActivo === null) {
      y += 65;
    } else {
      if (i < indiceActivo) {
        y += 65;
      } else if (i === indiceActivo) {
        y += alturaAbierta;
      } else {
        y += 65;
      }
    }
  });

  // Evita que la última tarjeta tape el contenido siguiente.
  const ultima = cards[cards.length - 1];
  if (ultima) {
    const stack = ultima.closest('.tickets-stack');
    if (stack) {
      const offsetUltima = parseFloat(ultima.style.getPropertyValue('--offset')) || 0;
      stack.style.minHeight = `${offsetUltima + ultima.scrollHeight}px`;
    }
  }
}

function posicionarBarajaInicio(stack, cards, indiceActivo = null) {
  const filaVisible = 58;
  const espacioActivo = 16;

  // La baraja se arma con márgenes para que la página conserve su altura real.
  cards.forEach((card, indice) => {
    card.style.removeProperty('--offset');
    card.style.removeProperty('--stack-top');
    card.style.removeProperty('top');
    card.style.removeProperty('left');
    card.style.removeProperty('transform');
    card.style.zIndex = String(indice + 1);

    if (indice === 0) {
      card.style.setProperty('margin-top', '0px', 'important');
      return;
    }

    const anterior = cards[indice - 1];
    const alturaAnterior = Number.parseFloat(anterior.style.getPropertyValue('--ticket-open-height'))
      || anterior.scrollHeight;
    const estaDebajoDelActivo = indiceActivo !== null && indice === indiceActivo + 1;
    const margen = estaDebajoDelActivo ? espacioActivo : filaVisible - alturaAnterior;
    card.style.setProperty('margin-top', `${margen}px`, 'important');
  });

  // Limpia la altura que pudo quedar de una selección anterior.
  stack.style.setProperty('min-height', '0px', 'important');
}

export function iniciarTicketsStack(stack) {
  if (!stack) return;
  const cards = [...stack.querySelectorAll('.ticket-card')];
  if (!cards.length) return;

  // Evita saltos mientras se vuelve a pintar la lista.
  stack.classList.remove('stack-ready');

  // Quita los eventos de la carga anterior.
  if (stack._iticketStackController) stack._iticketStackController.abort();
  if (stack._iticketResizeObserver) {
    stack._iticketResizeObserver.disconnect();
    delete stack._iticketResizeObserver;
  }
  const controller = new AbortController();
  const { signal } = controller;
  stack._iticketStackController = controller;

  const esBarajaFlujo = stack.classList.contains('tickets-stack-inicio')
    || stack.classList.contains('tickets-stack-flujo');
  let indiceExpandido = null;
  const medirAlturasAbiertas = () => {
    if (!esBarajaFlujo) return;
    cards.forEach(card => {
      // Guarda la altura abierta antes de animar.
      card.style.setProperty('--ticket-open-height', `${card.scrollHeight}px`);
    });
  };
  const posicionar = (indiceActivo) => {
    if (esBarajaFlujo) posicionarBarajaInicio(stack, cards, indiceActivo);
    else {
      const altura = indiceActivo === null ? 0 : cards[indiceActivo].scrollHeight + 20;
      posicionarTarjetas(cards, indiceActivo, altura);
    }
  };
  medirAlturasAbiertas();
  posicionar(null);
  void stack.offsetHeight;
  requestAnimationFrame(() => stack.classList.add('stack-ready'));

  cards.forEach((card, index) => {
    card.dataset.hasTicketBelow = String(index < cards.length - 1);
    card.setAttribute('aria-selected', 'false');
  });

  // Un solo evento maneja toda la pila.
  stack.addEventListener('click', (e) => {
    const card = e.target.closest('.ticket-card');
    if (!card || !stack.contains(card)) return;
    const index = cards.indexOf(card);
    if (index < 0) return;

    if (card.classList.contains('is-active')) {
      const url = card.getAttribute('data-url');
      if (url) window.location.href = url;
      return;
    }

    const tieneTicketDebajo = index < cards.length - 1;
    cards.forEach(c => {
      c.classList.remove('is-active', 'is-last-selection');
      c.setAttribute('aria-selected', 'false');
    });

    card.classList.add('is-active');
    card.classList.toggle('is-last-selection', !tieneTicketDebajo);
    card.setAttribute('aria-selected', 'true');
    indiceExpandido = tieneTicketDebajo ? index : null;
    posicionar(indiceExpandido);
  }, { signal });

  // Cierra la baraja al tocar fuera.
  document.addEventListener('click', (e) => {
    if (!stack.contains(e.target)) {
      cards.forEach(c => {
        c.classList.remove('is-active', 'is-last-selection');
        c.setAttribute('aria-selected', 'false');
      });
      indiceExpandido = null;
      posicionar(null);
    }
  }, { signal });

  // Recalcula las alturas al girar el teléfono o cambiar el tamaño.
  if (esBarajaFlujo) {
    let frameResize = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(frameResize);
      frameResize = requestAnimationFrame(() => {
        medirAlturasAbiertas();
        posicionar(indiceExpandido);
      });
    }, { passive: true, signal });

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!signal.aborted) {
          medirAlturasAbiertas();
          posicionar(indiceExpandido);
        }
      });
    }
  }
}

export function iniciarDesvanecidoAlDesplazar(distancia = 220) {
  const body = document.body;
  let framePendiente = false;

  const actualizar = () => {
    const recorrido = Math.min(1, Math.max(0, window.scrollY / distancia));
    body.style.setProperty('--inicio-degradado-opacidad', (1 - recorrido).toFixed(3));
    framePendiente = false;
  };

  window.addEventListener('scroll', () => {
    if (framePendiente) return;
    framePendiente = true;
    requestAnimationFrame(actualizar);
  }, { passive: true });

  actualizar();
}

export function renderizarPaginacion(contenedor, paginaActual, totalPaginas, alCambiarPagina, opciones = {}) {
  if (!contenedor) return;
  contenedor.innerHTML = '';

  const total = Math.max(0, Number(totalPaginas) || 0);
  const actual = Math.min(Math.max(1, Number(paginaActual) || 1), Math.max(1, total));
  if (total <= 1) return;

  agregarBotonPaginacion(
    contenedor,
    '<i class="bi bi-chevron-left" aria-hidden="true"></i>',
    actual - 1,
    actual === 1,
    false,
    alCambiarPagina,
    'Página anterior'
  );

  let anterior = 0;
  obtenerPaginasVisibles(actual, total, opciones.seguirPaginaActual).forEach((pagina, indice) => {
    const comienzaElUltimoTramo = anterior
      && pagina - anterior === 1
      && actual === total - 2
      && indice === 1;
    if (anterior && (pagina - anterior > 1 || comienzaElUltimoTramo)) {
      agregarSeparadorPaginacion(contenedor);
    }
    agregarBotonPaginacion(
      contenedor,
      String(pagina),
      pagina,
      false,
      pagina === actual,
      alCambiarPagina,
      `Página ${pagina}`
    );
    anterior = pagina;
  });

  agregarBotonPaginacion(
    contenedor,
    '<i class="bi bi-chevron-right" aria-hidden="true"></i>',
    actual + 1,
    actual === total,
    false,
    alCambiarPagina,
    'Página siguiente'
  );
}

function obtenerPaginasVisibles(actual, total, seguirPaginaActual = true) {
  if (seguirPaginaActual) {
    const mitad = Math.ceil(total / 2);
    if (actual <= mitad) {
      return [...new Set([actual, Math.min(actual + 1, total), total])];
    }
    return [...new Set([1, Math.max(1, actual - 1), actual])];
  }

  if (total <= 5) return Array.from({ length: total }, (_, indice) => indice + 1);

  return [...new Set([1, total, actual - 1, actual, actual + 1])]
    .filter((pagina) => pagina >= 1 && pagina <= total)
    .sort((a, b) => a - b);
}

function agregarBotonPaginacion(contenedor, contenido, pagina, deshabilitado, activo, alCambiarPagina, etiqueta) {
  const elemento = document.createElement('li');
  elemento.className = `page-item${deshabilitado ? ' disabled' : ''}${activo ? ' active' : ''}`;
  elemento.innerHTML = `
    <button type="button" class="page-link" aria-label="${etiqueta}" ${deshabilitado ? 'disabled' : ''}>
      ${contenido}
    </button>`;

  elemento.querySelector('button').addEventListener('click', () => {
    if (!deshabilitado && !activo) alCambiarPagina(pagina);
  });
  contenedor.appendChild(elemento);
}

function agregarSeparadorPaginacion(contenedor) {
  const elemento = document.createElement('li');
  elemento.className = 'page-item disabled paginacion-separador';
  elemento.innerHTML = '<span class="page-link" aria-hidden="true">…</span>';
  contenedor.appendChild(elemento);
}


document.addEventListener('DOMContentLoaded', () => {
  iniciarTicketsStack(document.getElementById('ticketsStack'));
});

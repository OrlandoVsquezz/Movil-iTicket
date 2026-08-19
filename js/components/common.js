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

// Inicializa el botón que se hace en un panel de opciones
export function iniciarSelectorInterfaz(selector) {
  if (!selector) return;

  const boton = selector.querySelector('#cambioInterfaz');
  const panel = selector.querySelector('#panelInterfaz');
  const opciones = selector.querySelectorAll('.opcion-interfaz');

  if (!boton || !panel) return;

  function cambiarEstado(abrir) {
    selector.classList.toggle('abierto', abrir);
    boton.setAttribute('aria-expanded', String(abrir));
    panel.setAttribute('aria-hidden', String(!abrir));
  }

  boton.addEventListener('click', (evento) => {
    evento.stopPropagation();
    cambiarEstado(!selector.classList.contains('abierto'));
  });

  // Al presionar una opcion el que esta seleccionado se deja de seleccionar y se va al nuevo
  opciones.forEach((opcion) => {
    opcion.addEventListener('click', () => {
      opciones.forEach(elemento => elemento.classList.remove('seleccionada'));
      opcion.classList.add('seleccionada');
      cambiarEstado(false);
    });
  });

  // Cierra el panel al tocar en alguna parte que no sea del panel
  document.addEventListener('click', (evento) => {
    if (!selector.contains(evento.target)) cambiarEstado(false);
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      cambiarEstado(false);
      boton.focus();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  iniciarTicketsStack(document.getElementById('ticketsStack'));
  iniciarSelectorInterfaz(document.getElementById('selectorInterfaz'));
});

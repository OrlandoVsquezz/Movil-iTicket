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
  iniciarTicketsStack(document.getElementById('ticketsStack'));
});
/* Deja listo el tema antes de mostrar la página. */
(function () {
  try {
    document.documentElement.classList.toggle(
      'tema-oscuro',
      localStorage.getItem('iticket_tema') === 'oscuro'
    );
  } catch (error) {
    console.warn('[iTicket] No se pudo aplicar el tema guardado.', error);
  }

  document.documentElement.classList.add('iticket-preparando');

  const estilo = document.createElement('style');
  estilo.id = 'iticket-estilo-carga';
  estilo.textContent = `
    html { background: #e8e9eb; }
    html.tema-oscuro { background: #070b14; }
    body { opacity: 1; }
    html.iticket-preparando body { opacity: 0; }
    html.iticket-listo body { opacity: 1; }
    html.iticket-navegando body { opacity: 1; pointer-events: none; }
    @media (prefers-reduced-motion: reduce) {
      body { transition: none; }
    }
  `;
  document.head.appendChild(estilo);

  function mostrarPagina() {
    document.documentElement.classList.remove('iticket-navegando', 'iticket-preparando');
    document.documentElement.classList.add('iticket-listo');
  }

  window.addEventListener('pageshow', mostrarPagina);
  window.setTimeout(mostrarPagina, 1600);
})();

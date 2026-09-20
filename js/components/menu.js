(function () {
  const THEME_KEY = 'iticket_tema';
  const file = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const appPages = new Set([
    'inicio.html', 'mistickets.html', 'ticketsasignados.html', 'gestiontickets.html',
    'crearticket.html', 'creartickets.html', 'chatbot.html', 'perfil.html',
    'notificaciones.html', 'proyectos.html', 'vistaproyecto.html', 'vistaticket.html',
    'evaluacionpendiente.html'
  ]);

  // Usa los mismos íconos del menú web.
  const icons = {
    home: '<svg class="app-nav-bootstrap-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3Zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3Zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3Zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3ZM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3Zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3ZM9 10.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3Zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3Z"/></svg>',
    tickets: '<svg class="app-nav-bootstrap-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4.85v.9h1v-.9zm7 0v.9h1v-.9zm-7 1.8v.9h1v-.9zm7 0v.9h1v-.9zm-7 1.8v.9h1v-.9zm7 0v.9h1v-.9zm-7 1.8v.9h1v-.9zm7 0v.9h1v-.9z"/><path d="M1.5 3A1.5 1.5 0 0 0 0 4.5V6a.5.5 0 0 0 .5.5 1.5 1.5 0 1 1 0 3 .5.5 0 0 0-.5.5v1.5A1.5 1.5 0 0 0 1.5 13h13a1.5 1.5 0 0 0 1.5-1.5V10a.5.5 0 0 0-.5-.5 1.5 1.5 0 0 1 0-3A.5.5 0 0 0 16 6V4.5A1.5 1.5 0 0 0 14.5 3zM1 4.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v1.05a2.5 2.5 0 0 0 0 4.9v1.05a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-1.05a2.5 2.5 0 0 0 0-4.9z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
    chat: '<svg class="app-nav-bootstrap-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/><path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2"/></svg>',
    profile: '<svg class="app-nav-bootstrap-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/></svg>'
  };

  function applyTheme(theme) {
    const dark = theme === 'oscuro';
    document.documentElement.classList.toggle('tema-oscuro', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.querySelectorAll('[data-theme-toggle]').forEach(toggle => {
      toggle.checked = dark;
      toggle.setAttribute('aria-checked', String(dark));
    });
    document.dispatchEvent(new CustomEvent('iticket:tema-cambiado', { detail: { oscuro: dark } }));
  }

  let transicionTema = null;
  let cambioTema = 0;

  async function changeTheme(theme) {
    const cambioActual = ++cambioTema;
    transicionTema?.skipTransition();
    transicionTema = null;
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof document.startViewTransition !== 'function') {
      root.classList.remove('tema-en-transicion');
      applyTheme(theme);
      return;
    }

    root.classList.add('tema-en-transicion');

    try {
      transicionTema = document.startViewTransition(() => {
        if (cambioActual === cambioTema) applyTheme(theme);
      });
      await transicionTema.finished;
    } catch {
      if (cambioActual === cambioTema) applyTheme(theme);
    } finally {
      if (cambioActual === cambioTema) {
        transicionTema = null;
        root.classList.remove('tema-en-transicion');
      }
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'claro';
    applyTheme(saved);
    document.querySelectorAll('.card-opcion').forEach(card => {
      if (!card.textContent.toLowerCase().includes('modo oscuro')) return;
      const toggle = card.querySelector('input[type="checkbox"]');
      if (!toggle) return;
      toggle.dataset.themeToggle = 'true';
      toggle.setAttribute('aria-label', 'Activar modo oscuro');
    });
    document.querySelectorAll('[data-theme-toggle]').forEach(toggle => {
      toggle.checked = saved === 'oscuro';
      toggle.addEventListener('change', () => {
        const theme = toggle.checked ? 'oscuro' : 'claro';
        localStorage.setItem(THEME_KEY, theme);
        changeTheme(theme);
      });
    });
    window.addEventListener('storage', event => {
      if (event.key === THEME_KEY) changeTheme(event.newValue || 'claro');
    });
  }

  function activeSection() {
    if (file === 'inicio.html') return 'home';
    if (['mistickets.html', 'ticketsasignados.html', 'gestiontickets.html', 'vistaticket.html', 'proyectos.html', 'vistaproyecto.html', 'evaluacionpendiente.html'].includes(file)) return 'tickets';
    if (['crearticket.html', 'creartickets.html'].includes(file)) return 'create';
    if (file === 'chatbot.html') return 'chat';
    return 'profile';
  }

  function navLink(href, label, icon, section, index, extra = '') {
    const active = activeSection() === section ? ' active' : '';
    const current = active ? ' aria-current="page"' : '';
    return `<a href="${href}" class="app-nav-item${active} ${extra}" data-nav-index="${index}" aria-label="${label}"${current}>${icon}<span>${label}</span></a>`;
  }

  function buildMenu() {
    if (!appPages.has(file)) return;
    document.body.classList.add('app-shell-active');
    document.querySelectorAll('.encabezado-flotante').forEach(header => {
      const vacio = header.children.length === 0 && header.textContent.trim() === '';
      header.classList.toggle('encabezado-vacio', vacio);
    });
    document.querySelectorAll('.bottom-nav-container, .app-more-sheet').forEach(node => node.remove());

    const nav = document.createElement('nav');
    nav.className = 'bottom-nav-container app-bottom-nav';
    nav.setAttribute('aria-label', 'Navegación principal');
    const activeIndex = ['home', 'tickets', 'create', 'chat', 'profile'].indexOf(activeSection());
    const estaCompletandoTicket = file === 'creartickets.html';
    const accionCrear = estaCompletandoTicket
      ? { href: 'crearTicket.html', label: 'Volver', icon: icons.back, extra: 'app-back-item' }
      : { href: 'crearTicket.html', label: 'Crear ticket', icon: icons.plus, extra: '' };
    nav.innerHTML = `<div class="bottom-nav" style="--nav-index: ${activeIndex}">
      <span class="app-nav-indicator" aria-hidden="true"></span>
      ${navLink('inicio.html', 'Inicio', icons.home, 'home', 0)}
      ${navLink('misTickets.html', 'Tickets', icons.tickets, 'tickets', 1)}
      ${navLink(accionCrear.href, accionCrear.label, accionCrear.icon, 'create', 2, accionCrear.extra)}
      ${navLink('chatbot.html', 'Chatbot', icons.chat, 'chat', 3)}
      ${navLink('perfil.html', 'Perfil', icons.profile, 'profile', 4)}
    </div>`;
    document.body.append(nav);

    // Espera la animación antes de cambiar de página.
    nav.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const item = event.target.closest('.app-nav-item');
      if (!item) return;
      event.preventDefault();
      event.stopPropagation();
      navegarSuave(item.href, item);
    });

    const entrada = Number(sessionStorage.getItem('iticket_nav_direction') || 0);
    if (entrada) {
      document.body.style.setProperty('--page-enter-direction', String(entrada));
      sessionStorage.removeItem('iticket_nav_direction');
    }
    document.querySelectorAll('button.notificaciones, .notificaciones-no-individual').forEach(button => {
      if (button.closest('.filter-wrapper')) return;
      button.setAttribute('aria-label', 'Abrir notificaciones');
      const paginaOrigen = `${window.location.pathname.split('/').pop() || 'inicio.html'}${window.location.search}`;
      const destinoNotificaciones = `notificaciones.html?volver=${encodeURIComponent(paginaOrigen)}`;
      if (button.matches('a')) button.href = destinoNotificaciones;
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        navegarSuave(destinoNotificaciones);
      });
    });
  }

  let navegacionEnCurso = false;

  function animarIconosDelRecorrido(actual, destino, duracion) {
    const items = [...document.querySelectorAll('.app-nav-item')];
    const direccion = Math.sign(destino - actual);
    const pasos = Math.abs(destino - actual);
    if (!direccion || !pasos) return;

    for (let paso = 1; paso <= pasos; paso += 1) {
      const item = items[actual + direccion * paso];
      window.setTimeout(() => {
        item.classList.add('nav-crossed');
        window.setTimeout(() => item.classList.remove('nav-crossed'), 420);
      }, Math.round((duracion * paso) / pasos) - 150);
    }
  }

  function navegarSuave(destino, navItem = null) {
    if (navegacionEnCurso) return;
    const destinoUrl = new URL(destino, window.location.href);
    if (navItem && destinoUrl.pathname.toLowerCase() === window.location.pathname.toLowerCase()) {
      navItem.classList.remove('nav-reselected');
      requestAnimationFrame(() => navItem.classList.add('nav-reselected'));
      window.setTimeout(() => navItem.classList.remove('nav-reselected'), 520);
      return;
    }

    navegacionEnCurso = true;
    let espera = 360;

    if (navItem) {
      const barra = document.querySelector('.app-bottom-nav .bottom-nav');
      const actual = Number(barra?.style.getPropertyValue('--nav-index') || 0);
      const destinoIndex = Number(navItem.dataset.navIndex);
      const distancia = Math.abs(destinoIndex - actual);
      const direccion = Math.sign(destinoIndex - actual);
      espera = Math.min(920, 590 + distancia * 85);

      barra?.style.setProperty('--nav-duration', `${espera}ms`);
      // Fuerza el primer cuadro de la animación.
      barra?.getBoundingClientRect();
      barra?.style.setProperty('--nav-index', String(destinoIndex));
      document.querySelectorAll('.app-nav-item').forEach(item => item.classList.toggle('nav-target', item === navItem));
      document.body.style.setProperty('--page-leave-direction', String(direccion));
      document.body.classList.add('app-nav-is-moving', direccion < 0 ? 'nav-moving-left' : 'nav-moving-right');
      animarIconosDelRecorrido(actual, destinoIndex, espera);
      window.setTimeout(() => document.body.classList.add('app-page-leaving'), Math.round(espera * .46));
      sessionStorage.setItem('iticket_nav_direction', String(direccion || 1));
    } else {
      document.body.style.setProperty('--page-leave-direction', '0');
      document.body.classList.add('app-page-leaving');
    }

    document.documentElement.classList.remove('iticket-listo');
    document.documentElement.classList.add('iticket-navegando');
    window.setTimeout(() => window.location.assign(destinoUrl.href), espera);
  }

  function initNavegacionSuave() {
    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const enlace = event.target.closest('a[href]');
      if (!enlace || enlace.target === '_blank' || enlace.hasAttribute('download')) return;

      const href = enlace.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

      const destino = new URL(enlace.href, window.location.href);
      if (destino.origin !== window.location.origin || !destino.pathname.toLowerCase().endsWith('.html')) return;

      event.preventDefault();
      navegarSuave(destino.href, enlace.closest('.app-nav-item'));
    });

    window.addEventListener('pageshow', () => {
      navegacionEnCurso = false;
      document.body.classList.remove('app-page-leaving', 'app-nav-is-moving', 'nav-moving-left', 'nav-moving-right');
      document.documentElement.classList.remove('iticket-navegando', 'iticket-preparando');
      document.documentElement.classList.add('iticket-listo');
    });
  }

  function initTouchFeedback() {
    const selector = [
      'button:not(.app-nav-item)',
      '.button',
      '.button2',
      '.card-categoria',
      '.ticket-card',
      '.filter-opcion',
      '.card-opcion',
      '.btn'
    ].join(',');

    document.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const target = event.target.closest(selector);
      if (!target || target.matches(':disabled, [aria-disabled="true"]')) return;

      const rect = target.getBoundingClientRect();
      const ripple = document.createElement('span');
      const scale = Math.max(rect.width, rect.height) / 7 + 2;
      ripple.className = 'android-ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      ripple.style.setProperty('--ripple-scale', scale.toFixed(1));
      ripple.setAttribute('aria-hidden', 'true');
      target.classList.add('android-ripple-host');
      target.append(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
      window.setTimeout(() => ripple.remove(), 600);
    }, { passive: true });
  }

  function initDesvanecidoAlDesplazar() {
    if (!document.body.classList.contains('app-shell-active')) return;

    const selectoresDesplazamientoPrincipal = [
      'main.main',
      '[data-app-scroll-fade]',
      '.crear-ticket-scroll',
      '.tickets-scroll',
      '.contenedor-mensajes',
      '.lista-comentarios',
      '.lista-notificaciones',
      '.lista-gestion',
      '.proyectos-scroll'
    ].join(',');
    const selectoresDesplazamientoIgnorado = [
      'dialog',
      '.filter-panel',
      '.selector-interfaz',
      '.lista-sugerencias',
      '.lista-sugerencias-ticket',
      '.galeria-multimedia',
      '.contenedor-evidencias',
      '.tira-modal',
      'textarea'
    ].join(',');
    const distanciaDesvanecido = 280;
    const fuentesDesplazamiento = new Set();
    let framePendiente = 0;

    const esFuenteDesplazamientoPrincipal = elemento => {
      if (!(elemento instanceof Element) || elemento.closest(selectoresDesplazamientoIgnorado)) return false;
      if (elemento.matches(selectoresDesplazamientoPrincipal)) return true;

      const estilo = getComputedStyle(elemento);
      const tieneScrollVertical = /^(auto|scroll)$/.test(estilo.overflowY)
        && elemento.scrollHeight > elemento.clientHeight + 2;
      const ocupaAreaPrincipal = elemento.clientHeight >= Math.min(220, innerHeight * .32)
        && elemento.clientWidth >= Math.min(260, innerWidth * .65);

      return tieneScrollVertical && ocupaAreaPrincipal;
    };

    document.querySelectorAll(selectoresDesplazamientoPrincipal).forEach(elemento => {
      if (!elemento.closest(selectoresDesplazamientoIgnorado)) fuentesDesplazamiento.add(elemento);
    });

    const obtenerDesplazamiento = () => {
      const desplazamientos = [
        window.scrollY || 0,
        document.scrollingElement?.scrollTop || 0
      ];

      fuentesDesplazamiento.forEach(elemento => {
        if (!elemento.isConnected) {
          fuentesDesplazamiento.delete(elemento);
          return;
        }
        desplazamientos.push(elemento.scrollTop || 0);
      });

      return Math.max(...desplazamientos);
    };

    const actualizar = () => {
      const desplazamiento = obtenerDesplazamiento();
      const progreso = Math.min(1, Math.max(0, desplazamiento / distanciaDesvanecido));

      document.body.style.setProperty('--app-degradado-opacidad', (1 - progreso).toFixed(3));
      document.body.style.setProperty('--app-degradado-progreso', progreso.toFixed(3));
      document.body.classList.toggle('app-contenido-desplazado', desplazamiento > 4);
      framePendiente = 0;
    };

    const solicitarActualizacion = () => {
      if (framePendiente) return;
      framePendiente = requestAnimationFrame(actualizar);
    };

    window.addEventListener('scroll', solicitarActualizacion, { passive: true });
    document.addEventListener('scroll', event => {
      const origen = event.target;
      if (origen instanceof Element) {
        if (!esFuenteDesplazamientoPrincipal(origen)) return;
        fuentesDesplazamiento.add(origen);
      }
      solicitarActualizacion();
    }, { capture: true, passive: true });
    window.addEventListener('pageshow', solicitarActualizacion, { passive: true });

    actualizar();
  }

  function init() {
    buildMenu();
    initTheme();
    initNavegacionSuave();
    initTouchFeedback();
    initDesvanecidoAlDesplazar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* =====================================================================
   DROPDOWNS Y CALENDARIO PERSONALIZADOS
   Las listas de <select> y los calendarios de <input type="date"> los dibuja el sistema
   y casi no se pueden estilizar. Aquí el campo original se queda visible con su diseño de
   siempre (y su validación), pero encima lleva un botón transparente que abre una lista o
   un calendario propio. Los controladores siguen usando .value y el evento "change" igual.
   Los filtros con fecha oculta (.input-fecha-oculto) abren el calendario con showPicker().
   Para excluir un campo: data-select-nativo o data-fecha-nativa.
   ===================================================================== */
(function () {
  const NOMBRES_DIAS = ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá'];
  let abierto = null; // { panel, cerrar(devolverFoco), contiene(nodo) }

  function iniciar() {
    mejorarTodo(document);
    new MutationObserver((cambios) => {
      cambios.forEach((cambio) => cambio.addedNodes.forEach((nodo) => {
        if (nodo.nodeType === Node.ELEMENT_NODE) mejorarTodo(nodo);
      }));
    }).observe(document.body, { childList: true, subtree: true });

    document.addEventListener('pointerdown', (evento) => {
      if (abierto && !abierto.contiene(evento.target)) abierto.cerrar(false);
    });
    window.addEventListener('resize', () => abierto && abierto.cerrar(false));
    document.addEventListener('scroll', (evento) => {
      if (abierto && !abierto.panel.contains(evento.target)) abierto.cerrar(false);
    }, true);
  }

  function mejorarTodo(raiz) {
    const lista = (selector) => [...(raiz.matches?.(selector) ? [raiz] : []), ...(raiz.querySelectorAll?.(selector) || [])];
    lista('select').forEach(mejorarSelect);
    lista('input[type="date"], input[type="datetime-local"]').forEach(mejorarFecha);
  }

  function nombreDelCampo(campo) {
    const etiqueta = campo.id ? document.querySelector(`label[for="${CSS.escape(campo.id)}"]`) : null;
    return (etiqueta?.textContent || campo.getAttribute('aria-label') || '').replace(/:\s*$/, '').trim();
  }

  // Envuelve el campo y le pone encima un botón transparente del mismo tamaño
  function envolverConBoton(campo, claseEnvoltorio) {
    const envoltorio = document.createElement('div');
    envoltorio.className = `control-personalizado ${claseEnvoltorio}`;
    campo.parentNode.insertBefore(envoltorio, campo);
    envoltorio.appendChild(campo);

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'control-personalizado-activador';
    envoltorio.appendChild(boton);

    campo.tabIndex = -1;
    campo.addEventListener('focus', () => boton.focus());
    const etiqueta = campo.id ? document.querySelector(`label[for="${CSS.escape(campo.id)}"]`) : null;
    etiqueta?.addEventListener('click', (evento) => { evento.preventDefault(); boton.focus(); });
    return { envoltorio, boton };
  }

  // Panel flotante con position: fixed debajo (o encima) del campo. Dentro de un <dialog> o de un
  // contenedor con transform, "fixed" se mide desde ese contenedor: se prueban dos posiciones para
  // saber dónde queda el origen y cuánto mide un píxel. Se mide sin la animación de apertura.
  function posicionar(panel, rect, altoMaximo) {
    const espacioAbajo = window.innerHeight - rect.bottom - 12;
    const espacioArriba = rect.top - 12;
    const haciaArriba = espacioAbajo < Math.min(panel.scrollHeight, altoMaximo) && espacioArriba > espacioAbajo;
    panel.classList.toggle('hacia-arriba', haciaArriba);

    const ancho = panel.offsetWidth;
    const izquierda = Math.max(8, Math.min(rect.left, window.innerWidth - ancho - 8));
    const arriba = haciaArriba ? rect.top - 6 - panel.offsetHeight : rect.bottom + 6;

    panel.style.animation = 'none';
    panel.style.left = '0px';
    panel.style.top = '0px';
    const origen = panel.getBoundingClientRect();
    panel.style.left = '100px';
    panel.style.top = '100px';
    const prueba = panel.getBoundingClientRect();
    const escalaX = (prueba.left - origen.left) / 100 || 1;
    const escalaY = (prueba.top - origen.top) / 100 || 1;
    panel.style.left = `${(izquierda - origen.left) / escalaX}px`;
    panel.style.top = `${(arriba - origen.top) / escalaY}px`;
    void panel.offsetWidth;
    panel.style.animation = '';
  }

  /* ---------------- Dropdowns ---------------- */

  function mejorarSelect(select) {
    if (select.__controlPersonalizado || select.multiple || select.size > 1 || select.hasAttribute('data-select-nativo')) return;

    const { envoltorio, boton } = envolverConBoton(select, 'select-movil');
    const lista = document.createElement('ul');
    lista.className = 'panel-personalizado lista-personalizada';
    lista.setAttribute('role', 'listbox');
    lista.hidden = true;
    envoltorio.appendChild(lista);

    boton.setAttribute('role', 'combobox');
    boton.setAttribute('aria-haspopup', 'listbox');
    boton.setAttribute('aria-expanded', 'false');

    const estado = { select, envoltorio, boton, lista, indiceActivo: -1, busqueda: '', temporizador: null };
    select.__controlPersonalizado = estado;

    const actualizarNombre = () => {
      const opcion = select.options[select.selectedIndex];
      const nombre = nombreDelCampo(select);
      boton.setAttribute('aria-label', [nombre, opcion?.textContent.trim()].filter(Boolean).join(': '));
      boton.disabled = select.disabled;
      if (!lista.hidden) construirOpciones(estado);
    };
    estado.actualizarNombre = actualizarNombre;

    // Asignar .value o .selectedIndex desde JavaScript no dispara eventos: se intercepta
    ['value', 'selectedIndex'].forEach((propiedad) => {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, propiedad);
      Object.defineProperty(select, propiedad, {
        configurable: true,
        get() { return descriptor.get.call(this); },
        set(valor) { descriptor.set.call(this, valor); actualizarNombre(); }
      });
    });
    select.addEventListener('change', actualizarNombre);
    new MutationObserver(actualizarNombre).observe(select, {
      childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['disabled']
    });

    boton.addEventListener('click', () => (lista.hidden ? abrirSelect(estado) : cerrarSelect(estado, true)));
    boton.addEventListener('keydown', (evento) => tecladoSelect(estado, evento));
    lista.addEventListener('click', (evento) => {
      const opcion = evento.target.closest('[data-indice]');
      if (opcion && !opcion.classList.contains('deshabilitada')) elegirOpcion(estado, Number(opcion.dataset.indice));
    });
    actualizarNombre();
  }

  function construirOpciones(estado) {
    const { select, lista } = estado;
    lista.innerHTML = '';
    [...select.options].forEach((opcion, indice) => {
      if (opcion.hidden) return;
      const elemento = document.createElement('li');
      elemento.dataset.indice = indice;
      elemento.id = `${select.id || 'select'}OpcionPersonalizada${indice}`;
      elemento.setAttribute('role', 'option');
      elemento.className = 'opcion-personalizada';
      const seleccionada = indice === select.selectedIndex;
      elemento.setAttribute('aria-selected', String(seleccionada));
      if (seleccionada) elemento.classList.add('seleccionada');
      if (opcion.disabled) {
        elemento.classList.add('deshabilitada');
        elemento.setAttribute('aria-disabled', 'true');
      }
      elemento.innerHTML = '<span></span><i class="bi bi-check2" aria-hidden="true"></i>';
      elemento.querySelector('span').textContent = opcion.textContent.trim();
      lista.appendChild(elemento);
    });
  }

  function abrirSelect(estado) {
    if (estado.boton.disabled) return;
    abierto?.cerrar(false);
    const { lista, boton, envoltorio, select } = estado;
    construirOpciones(estado);
    lista.hidden = false;
    boton.setAttribute('aria-expanded', 'true');
    envoltorio.classList.add('abierto');

    const rect = select.getBoundingClientRect();
    lista.style.minWidth = `${rect.width}px`;
    lista.style.maxWidth = `${Math.max(rect.width, 280)}px`;
    lista.style.maxHeight = `${Math.max(160, Math.min(340, window.innerHeight - 24))}px`;
    posicionar(lista, rect, 340);
    marcarActiva(estado, select.selectedIndex >= 0 ? select.selectedIndex : siguienteHabilitada(estado, 0, 1));

    abierto = { panel: lista, contiene: (nodo) => envoltorio.contains(nodo), cerrar: (foco) => cerrarSelect(estado, foco) };
  }

  function cerrarSelect(estado, devolverFoco) {
    estado.lista.hidden = true;
    estado.boton.setAttribute('aria-expanded', 'false');
    estado.boton.removeAttribute('aria-activedescendant');
    estado.envoltorio.classList.remove('abierto');
    if (abierto?.panel === estado.lista) abierto = null;
    if (devolverFoco) estado.boton.focus();
  }

  function marcarActiva(estado, indice) {
    estado.indiceActivo = indice;
    estado.lista.querySelectorAll('.activa').forEach((elemento) => elemento.classList.remove('activa'));
    const elemento = estado.lista.querySelector(`[data-indice="${indice}"]`);
    if (!elemento) return;
    elemento.classList.add('activa');
    estado.boton.setAttribute('aria-activedescendant', elemento.id);
    elemento.scrollIntoView({ block: 'nearest' });
  }

  function siguienteHabilitada(estado, desde, paso) {
    const opciones = estado.select.options;
    for (let i = desde; i >= 0 && i < opciones.length; i += paso) {
      if (!opciones[i].disabled && !opciones[i].hidden) return i;
    }
    return -1;
  }

  function elegirOpcion(estado, indice) {
    const { select } = estado;
    const cambio = select.selectedIndex !== indice;
    select.selectedIndex = indice;
    cerrarSelect(estado, true);
    if (cambio) {
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function tecladoSelect(estado, evento) {
    const estaAbierto = !estado.lista.hidden;
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      if (!estaAbierto) { abrirSelect(estado); return; }
      const paso = evento.key === 'ArrowDown' ? 1 : -1;
      const siguiente = siguienteHabilitada(estado, estado.indiceActivo + paso, paso);
      if (siguiente >= 0) marcarActiva(estado, siguiente);
    } else if (evento.key === 'Enter' || (evento.key === ' ' && !estado.busqueda)) {
      evento.preventDefault();
      if (!estaAbierto) abrirSelect(estado);
      else if (estado.indiceActivo >= 0) elegirOpcion(estado, estado.indiceActivo);
    } else if (evento.key === 'Escape' && estaAbierto) {
      evento.preventDefault(); // también evita que se cierre el <dialog> que lo contiene
      evento.stopPropagation();
      cerrarSelect(estado, true);
    } else if (evento.key === 'Tab' && estaAbierto) {
      cerrarSelect(estado, false);
    } else if (evento.key.length === 1 && !evento.ctrlKey && !evento.metaKey && !evento.altKey) {
      estado.busqueda += evento.key.toLowerCase();
      clearTimeout(estado.temporizador);
      estado.temporizador = setTimeout(() => { estado.busqueda = ''; }, 600);
      const coincidencia = [...estado.select.options].findIndex((opcion) =>
        !opcion.disabled && !opcion.hidden && opcion.textContent.trim().toLowerCase().startsWith(estado.busqueda));
      if (coincidencia < 0) return;
      if (estaAbierto) marcarActiva(estado, coincidencia);
      else elegirOpcion(estado, coincidencia);
    }
  }

  /* ---------------- Calendario ---------------- */

  const dos = (n) => String(n).padStart(2, '0');
  const aTexto = (fecha) => `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
  function deTexto(texto) {
    const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto || '');
    return partes ? new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])) : null;
  }

  function mejorarFecha(input) {
    if (input.__controlPersonalizado || input.hasAttribute('data-fecha-nativa')) return;

    const conHora = input.type === 'datetime-local';
    const oculto = input.classList.contains('input-fecha-oculto');
    let envoltorio;
    let boton;

    if (oculto) {
      // Filtros: el campo está oculto y lo abre su botón con showPicker()
      envoltorio = input.parentElement;
      boton = input.previousElementSibling?.matches('button') ? input.previousElementSibling : null;
    } else {
      ({ envoltorio, boton } = envolverConBoton(input, 'fecha-movil'));
      boton.setAttribute('aria-haspopup', 'dialog');
      const actualizarNombre = () => boton.setAttribute('aria-label', `${nombreDelCampo(input) || 'Fecha'}: ${input.value ? input.value.replace('T', ' ') : 'sin elegir'}. Abrir calendario`);
      input.addEventListener('change', actualizarNombre);
      actualizarNombre();
    }

    const panel = document.createElement('div');
    panel.className = 'panel-personalizado calendario-movil';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Elegir fecha');
    panel.hidden = true;
    panel.innerHTML = `
      <div class="calendario-encabezado">
        <button type="button" class="calendario-flecha" data-mover="-1" aria-label="Mes anterior"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>
        <span class="calendario-mes" aria-live="polite"></span>
        <button type="button" class="calendario-flecha" data-mover="1" aria-label="Mes siguiente"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>
      </div>
      <div class="calendario-semana" aria-hidden="true">${NOMBRES_DIAS.map((dia) => `<span>${dia}</span>`).join('')}</div>
      <div class="calendario-dias"></div>
      ${conHora ? '<label class="calendario-hora"><span>Hora</span><input type="time" step="60" data-fecha-nativa></label>' : ''}
      <div class="calendario-pie">
        <button type="button" class="calendario-accion" data-accion="borrar">Borrar</button>
        <button type="button" class="calendario-accion calendario-accion-principal" data-accion="hoy">Hoy</button>
      </div>`;
    envoltorio.appendChild(panel);

    const estado = { input, envoltorio, boton, panel, conHora, oculto, mesVisible: null, diaActivo: null };
    input.__controlPersonalizado = estado;

    if (oculto) {
      // El mismo botón del filtro abre y cierra el calendario
      input.showPicker = () => (panel.hidden ? abrirCalendario(estado) : cerrarCalendario(estado, false));
    } else {
      boton.addEventListener('click', () => (panel.hidden ? abrirCalendario(estado) : cerrarCalendario(estado, true)));
      boton.addEventListener('keydown', (evento) => {
        if (['Enter', ' ', 'ArrowDown'].includes(evento.key) && panel.hidden) {
          evento.preventDefault();
          abrirCalendario(estado);
        }
      });
    }

    panel.addEventListener('click', (evento) => {
      const flecha = evento.target.closest('[data-mover]');
      if (flecha) { moverMes(estado, Number(flecha.dataset.mover)); return; }
      const dia = evento.target.closest('[data-fecha]');
      if (dia && !dia.disabled) { elegirFecha(estado, deTexto(dia.dataset.fecha)); return; }
      const accion = evento.target.closest('[data-accion]')?.dataset.accion;
      if (accion === 'hoy') elegirFecha(estado, new Date());
      if (accion === 'borrar') elegirFecha(estado, null);
    });
    panel.addEventListener('keydown', (evento) => tecladoCalendario(estado, evento));
    panel.querySelector('.calendario-hora input')?.addEventListener('change', (evento) => {
      asignarFecha(estado, deTexto(input.value) || new Date(), evento.target.value);
    });
  }

  function anclaDelCalendario(estado) {
    if (!estado.oculto) return estado.input.getBoundingClientRect();
    return (estado.boton || estado.envoltorio).getBoundingClientRect();
  }

  function abrirCalendario(estado) {
    if (estado.input.disabled || estado.input.readOnly) return;
    abierto?.cerrar(false);
    const base = deTexto(estado.input.value) || new Date();
    estado.mesVisible = new Date(base.getFullYear(), base.getMonth(), 1);
    estado.diaActivo = base;

    estado.panel.hidden = false;
    estado.envoltorio.classList.add('abierto');
    pintarCalendario(estado);
    posicionar(estado.panel, anclaDelCalendario(estado), 460);
    estado.panel.querySelector('.calendario-dia.activo')?.focus({ preventScroll: true });

    abierto = {
      panel: estado.panel,
      contiene: (nodo) => estado.panel.contains(nodo) || (estado.boton?.contains(nodo) ?? false),
      cerrar: (foco) => cerrarCalendario(estado, foco)
    };
  }

  function cerrarCalendario(estado, devolverFoco) {
    estado.panel.hidden = true;
    estado.envoltorio.classList.remove('abierto');
    if (abierto?.panel === estado.panel) abierto = null;
    if (devolverFoco) estado.boton?.focus();
  }

  function moverMes(estado, meses) {
    const { mesVisible, diaActivo } = estado;
    estado.mesVisible = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + meses, 1);
    const ultimo = new Date(estado.mesVisible.getFullYear(), estado.mesVisible.getMonth() + 1, 0).getDate();
    estado.diaActivo = new Date(estado.mesVisible.getFullYear(), estado.mesVisible.getMonth(), Math.min(diaActivo.getDate(), ultimo));
    pintarCalendario(estado);
  }

  function fueraDeRango(estado, fecha) {
    const texto = aTexto(fecha);
    const minimo = (estado.input.min || '').slice(0, 10);
    const maximo = (estado.input.max || '').slice(0, 10);
    return Boolean((minimo && texto < minimo) || (maximo && texto > maximo));
  }

  function pintarCalendario(estado) {
    const { panel, mesVisible, input } = estado;
    const titulo = mesVisible.toLocaleDateString('es', { month: 'long', year: 'numeric' });
    panel.querySelector('.calendario-mes').textContent = titulo.charAt(0).toUpperCase() + titulo.slice(1);

    const seleccionada = input.value.slice(0, 10);
    const hoy = aTexto(new Date());
    const activo = aTexto(estado.diaActivo);
    const inicio = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1 - mesVisible.getDay());
    const dias = panel.querySelector('.calendario-dias');
    dias.innerHTML = '';
    for (let i = 0; i < 42; i++) {
      const fecha = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
      const texto = aTexto(fecha);
      const dia = document.createElement('button');
      dia.type = 'button';
      dia.className = 'calendario-dia';
      dia.dataset.fecha = texto;
      dia.textContent = fecha.getDate();
      dia.tabIndex = texto === activo ? 0 : -1;
      dia.setAttribute('aria-label', fecha.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
      if (fecha.getMonth() !== mesVisible.getMonth()) dia.classList.add('otro-mes');
      if (texto === hoy) dia.classList.add('hoy');
      if (texto === seleccionada) { dia.classList.add('seleccionado'); dia.setAttribute('aria-pressed', 'true'); }
      if (texto === activo) dia.classList.add('activo');
      if (fueraDeRango(estado, fecha)) dia.disabled = true;
      dias.appendChild(dia);
    }
    const hora = panel.querySelector('.calendario-hora input');
    if (hora) hora.value = input.value.slice(11, 16) || hora.value || '08:00';
  }

  function asignarFecha(estado, fecha, hora) {
    const { input, conHora, panel } = estado;
    if (!fecha) input.value = '';
    else if (conHora) input.value = `${aTexto(fecha)}T${hora || panel.querySelector('.calendario-hora input')?.value || '08:00'}`;
    else input.value = aTexto(fecha);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function elegirFecha(estado, fecha) {
    if (fecha && fueraDeRango(estado, fecha)) return;
    asignarFecha(estado, fecha);
    // Con hora se queda abierto para poder ajustarla; sin hora se cierra
    if (estado.conHora && fecha) {
      estado.diaActivo = fecha;
      estado.mesVisible = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      pintarCalendario(estado);
    } else {
      cerrarCalendario(estado, true);
    }
  }

  function tecladoCalendario(estado, evento) {
    if (evento.key === 'Escape') {
      evento.preventDefault(); // también evita que se cierre el <dialog> que lo contiene
      evento.stopPropagation();
      cerrarCalendario(estado, true);
      return;
    }
    if (!evento.target.classList.contains('calendario-dia')) return;
    const saltos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const actual = estado.diaActivo;
    let nueva = null;
    if (saltos[evento.key]) nueva = new Date(actual.getFullYear(), actual.getMonth(), actual.getDate() + saltos[evento.key]);
    if (evento.key === 'PageUp') nueva = new Date(actual.getFullYear(), actual.getMonth() - 1, actual.getDate());
    if (evento.key === 'PageDown') nueva = new Date(actual.getFullYear(), actual.getMonth() + 1, actual.getDate());
    if (!nueva) return;
    evento.preventDefault();
    estado.diaActivo = nueva;
    estado.mesVisible = new Date(nueva.getFullYear(), nueva.getMonth(), 1);
    pintarCalendario(estado);
    estado.panel.querySelector('.calendario-dia.activo')?.focus();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();

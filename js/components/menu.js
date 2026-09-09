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

  async function changeTheme(theme, origin) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof document.startViewTransition !== 'function') {
      applyTheme(theme);
      return;
    }

    const rect = origin.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const root = document.documentElement;
    root.style.setProperty('--tema-origen-x', `${x}px`);
    root.style.setProperty('--tema-origen-y', `${y}px`);
    root.style.setProperty('--tema-radio-final', `${radius}px`);
    root.classList.add('tema-en-transicion');

    try {
      await document.startViewTransition(() => applyTheme(theme)).finished;
    } finally {
      root.classList.remove('tema-en-transicion');
      root.style.removeProperty('--tema-origen-x');
      root.style.removeProperty('--tema-origen-y');
      root.style.removeProperty('--tema-radio-final');
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
        changeTheme(theme, toggle);
      });
    });
    window.addEventListener('storage', event => {
      if (event.key === THEME_KEY) applyTheme(event.newValue || 'claro');
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
      button.addEventListener('click', () => navegarSuave('notificaciones.html'));
    });
  }

  let navegacionEnCurso = false;

  function crearOndaNavegacion(navItem, duracion) {
    const rect = navItem.getBoundingClientRect();
    const onda = document.createElement('div');
    onda.className = 'app-route-wave';
    onda.style.setProperty('--route-x', `${rect.left + rect.width / 2}px`);
    onda.style.setProperty('--route-y', `${rect.top + 3}px`);
    onda.style.setProperty('--route-duration', `${Math.max(480, duracion * .68)}ms`);
    onda.setAttribute('aria-hidden', 'true');
    document.body.append(onda);
    requestAnimationFrame(() => requestAnimationFrame(() => onda.classList.add('is-visible')));
    return onda;
  }

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
      window.setTimeout(() => crearOndaNavegacion(navItem, espera), Math.round(espera * .34));
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

/* Mini aviso que sale arriba del menú cuando entran notificaciones nuevas.

   No sustituye a la campana ni a notificaciones.html: solo avisa. Pregunta cada
   cierto tiempo cuántas hay sin leer y, si el número subió desde la última vez,
   saca el aviso. Mientras sigue en pantalla las nuevas se van sumando
   (+1, +2, +3...), y al llegar al tope deja de contar y dice "Varias
   notificaciones nuevas". */

import { API_BASE_URL } from '../services/apiConfig.js';

const INTERVALO_MS = 20000;   // cada cuánto se le pregunta a la API
const DURACION_MS = 6000;     // cuánto se queda el aviso en pantalla
const TOPE_DETALLE = 10;      // a partir de aquí ya no se dice el número exacto

/* null = todavía no se ha hecho la primera lectura. Esa primera lectura solo
   sirve para fijar el punto de partida: si no, al entrar a cualquier pantalla
   saldría un aviso por notificaciones que ya estaban ahí desde antes. */
let conocidas = null;
let acumuladas = 0;
let temporizadorOcultar = null;
let temporizadorSondeo = null;
let elemento = null;
let iniciado = false;

function textoAviso(cantidad) {
    if (cantidad >= TOPE_DETALLE) return 'Varias notificaciones nuevas';
    return cantidad === 1 ? '+1 notificación nueva' : `+${cantidad} notificaciones nuevas`;
}

function textoContador(cantidad) {
    return cantidad >= TOPE_DETALLE ? '9+' : String(cantidad);
}

/* A propósito NO usa apiFetch ni el service de notificaciones.

   apiFetch trata cualquier 401 como "al usuario se le venció la sesión mientras
   trabajaba": borra sessionStorage y manda al login. Eso está bien cuando el 401
   viene de algo que la persona pidió, pero aquí el que pregunta es un temporizador
   de fondo. El token dura 15 minutos; con un sondeo cada 20 segundos, dejar la
   pantalla abierta un rato bastaba para que se borrara la sesión sola, y como
   obtenerRolUsuario() responde "usuario" cuando no hay sesión, el selector de
   interfaz se redibujaba con el menú de usuario aunque fueras admin.

   Así que este sondeo es silencioso: si no hay sesión válida simplemente se apaga
   y deja que sea la siguiente acción real de la persona la que la mande al login. */
async function consultarNoLeidas(idUsuario) {
    const respuesta = await fetch(
        `${API_BASE_URL}/notificaciones/no-leidas/contador?idUsuario=${idUsuario}`,
        { credentials: 'include' }
    );
    if (respuesta.status === 401 || respuesta.status === 403) return 'sin-sesion';
    if (!respuesta.ok) return null;

    const cuerpo = await respuesta.json().catch(() => null);
    return Number(cuerpo?.data);
}

function detenerSondeo() {
    window.clearInterval(temporizadorSondeo);
    temporizadorSondeo = null;
}

function obtenerElemento() {
    if (elemento?.isConnected) return elemento;

    elemento = document.createElement('div');
    elemento.className = 'aviso-notificaciones';
    elemento.setAttribute('role', 'status');
    elemento.setAttribute('aria-live', 'polite');
    elemento.hidden = true;
    elemento.innerHTML = `
        <span class="aviso-notificaciones-icono">
            <i class="bi bi-bell-fill" aria-hidden="true"></i>
            <span class="aviso-notificaciones-contador"></span>
        </span>
        <span class="aviso-notificaciones-texto"></span>
        <button type="button" class="aviso-notificaciones-cerrar" aria-label="Cerrar aviso">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>`;

    elemento.addEventListener('click', (evento) => {
        const cerrando = Boolean(evento.target.closest('.aviso-notificaciones-cerrar'));
        ocultar();
        // Tocar el aviso (no la X) lleva a la lista de notificaciones
        if (!cerrando) window.location.href = 'notificaciones.html';
    });

    document.body.appendChild(elemento);
    return elemento;
}

function mostrar() {
    const nodo = obtenerElemento();
    nodo.querySelector('.aviso-notificaciones-texto').textContent = textoAviso(acumuladas);
    nodo.querySelector('.aviso-notificaciones-contador').textContent = textoContador(acumuladas);
    nodo.hidden = false;

    /* Si ya estaba visible y solo subió el contador, se reinicia la animación a
       mano: quitar la clase y volver a leer offsetWidth obliga al navegador a
       recalcular antes de ponerla otra vez. */
    nodo.classList.remove('late');
    void nodo.offsetWidth;
    nodo.classList.add('visible', 'late');

    window.clearTimeout(temporizadorOcultar);
    temporizadorOcultar = window.setTimeout(ocultar, DURACION_MS);
}

function ocultar() {
    window.clearTimeout(temporizadorOcultar);
    acumuladas = 0;   // el siguiente aviso vuelve a empezar desde +1
    if (!elemento) return;

    elemento.classList.remove('visible', 'late');
    window.setTimeout(() => {
        if (elemento && !elemento.classList.contains('visible')) elemento.hidden = true;
    }, 260);
}

// El mismo punto que ya pinta notificacionesBadge.js al cargar la pantalla
function actualizarPunto(hayNoLeidas) {
    document.querySelectorAll('.notificacionAviso').forEach((punto) => {
        punto.hidden = !hayNoLeidas;
    });
}

async function revisar(idUsuario) {
    let conteo;
    try {
        conteo = await consultarNoLeidas(idUsuario);
    } catch (error) {
        // Sin conexión: no se avisa nada y se reintenta en el siguiente ciclo
        return;
    }

    if (conteo === 'sin-sesion') {
        detenerSondeo();
        return;
    }
    if (!Number.isFinite(conteo)) return;

    actualizarPunto(conteo > 0);

    if (conocidas === null) {
        conocidas = conteo;
        return;
    }

    if (conteo > conocidas) {
        acumuladas += conteo - conocidas;
        mostrar();
    }

    // También baja cuando el usuario las marca como leídas, para no volver a avisar de las mismas
    conocidas = conteo;
}

export function iniciarAvisoNotificaciones(idUsuario) {
    if (iniciado || !idUsuario) return;
    iniciado = true;

    revisar(idUsuario);
    temporizadorSondeo = window.setInterval(() => {
        if (!document.hidden) revisar(idUsuario);
    }, INTERVALO_MS);

    // Al volver a la app se revisa de una vez, sin esperar al siguiente ciclo
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && temporizadorSondeo) revisar(idUsuario);
    });
}

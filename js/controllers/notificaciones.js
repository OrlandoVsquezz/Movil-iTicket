import { getNotificaciones, contarNoLeidas, marcarComoLeida, marcarTodasComoLeidas } from '../services/notificacionesService.js';
import { obtenerIdUsuario } from '../utils/sesion.js';
import { renderizarPaginacion } from '../components/common.js';
import { mostrarError, mostrarExitoSimple } from '../components/notificacionesUI.js';

const TAMANO_PAGINA = 10;
const idUsuario = obtenerIdUsuario();
const btnVolver = document.getElementById('btnVolver');
let paginaActual = 1;

function obtenerPaginaRegreso() {
    const regreso = new URLSearchParams(window.location.search).get('volver');
    if (!regreso) return 'perfil.html';

    try {
        const destino = new URL(regreso, window.location.href);
        const archivo = destino.pathname.split('/').pop() || '';
        if (destino.origin !== window.location.origin || !archivo.toLowerCase().endsWith('.html')) return 'perfil.html';
        if (archivo.toLowerCase() === 'notificaciones.html') return 'perfil.html';
        return `${archivo}${destino.search}`;
    } catch {
        return 'perfil.html';
    }
}

const botonRegresar = document.querySelector('.regresar');
if (botonRegresar) botonRegresar.href = obtenerPaginaRegreso();

document.addEventListener('DOMContentLoaded', () => {
    //El boton de volver regresa a la pantalla anterior (desde donde se abrieron las notificaciones)
    //en vez de siempre ir a perfil.html; perfil.html queda solo como respaldo si no hay historial propio de la app
    if (btnVolver) {
        btnVolver.addEventListener('click', (e) => {
            if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
                e.preventDefault();
                window.history.back();
            }
        });
    }

    if (!idUsuario) return;
    cargarNotificaciones(1);
});

async function cargarNotificaciones(pagina) {
    const lista = document.getElementById('listaNotificaciones');
    if (!lista) return;

    lista.innerHTML = '<p class="text-muted text-center py-4">Cargando notificaciones...</p>';

    try {
        const resultado = await getNotificaciones(idUsuario, pagina, TAMANO_PAGINA);
        paginaActual = resultado.paginaActual || pagina;
        pintarNotificaciones(lista, resultado);
        pintarPaginacion(resultado.totalPaginas || 1, paginaActual);
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        lista.innerHTML = '<p class="text-muted text-center py-4">No se pudieron cargar las notificaciones.</p>';
        mostrarError('No se pudieron cargar las notificaciones. Intenta nuevamente.');
    }
}

function pintarNotificaciones(lista, resultado) {
    const notificaciones = resultado?.notificaciones || [];

    if (notificaciones.length === 0) {
        lista.innerHTML = '<p class="text-muted text-center py-4">No tienes notificaciones del ultimo mes.</p>';
        actualizarEncabezado(0);
        return;
    }

    const noLeidas = notificaciones.filter((n) => !n.leida).length;
    actualizarEncabezado(noLeidas);

    lista.innerHTML = notificaciones.map((n) => `
        <div class="notificacion ${n.leida ? '' : 'no-leida'}" data-id="${n.idNotificacion}" data-tipo="${n.tipo || ''}" data-tipo-entidad="${n.tipoEntidad || ''}" data-id-entidad="${n.idEntidad ?? ''}">
            <div class="notificacion-icono">
                <i class="bi ${iconoPorTipo(n.tipo)}"></i>
            </div>
            <div class="notificacion-contenido">
                <p class="notificacion-titulo">${n.titulo}</p>
                <p class="notificacion-mensaje">${n.mensaje}</p>
            </div>
        </div>
    `).join('');

    lista.querySelectorAll('.notificacion').forEach((item) => {
        item.addEventListener('click', () => manejarClicNotificacion(item));
    });
}

// Muestra u oculta el boton "Marcar todas como leidas" segun haya pendientes en esta pagina.
function actualizarEncabezado(noLeidas) {
    const boton = document.getElementById('btnMarcarTodasLeidas');
    if (boton) boton.hidden = noLeidas === 0;
}

function pintarPaginacion(totalPaginas, paginaActiva) {
    const contenedor = document.getElementById('paginacionNotificaciones');
    renderizarPaginacion(contenedor, paginaActiva, totalPaginas, cargarNotificaciones);
}

document.getElementById('btnMarcarTodasLeidas')?.addEventListener('click', async () => {
    try {
        await marcarTodasComoLeidas(idUsuario);
        await cargarNotificaciones(paginaActual);
        mostrarExitoSimple('Notificaciones actualizadas', 'Todas quedaron marcadas como leídas.');
    } catch (error) {
        console.error('Error al marcar todas como leidas:', error);
        mostrarError('No se pudieron marcar las notificaciones como leídas.');
    }
});

// Mapea el tipo de entidad guardado en la notificacion a la pagina de detalle correspondiente.
function construirUrlDestino(tipo, tipoEntidad, idEntidad) {
    if (tipo === 'TICKET_ELIMINADO') return null;
    if (!tipoEntidad || !idEntidad) return null;
    switch (tipoEntidad) {
        case 'Ticket':
            return `vistaTicket.html?id=${idEntidad}`;
        case 'Proyecto':
            return `vistaProyecto.html?id=${idEntidad}`;
        default:
            return null;
    }
}

async function manejarClicNotificacion(item) {
    const id = item.dataset.id;
    const eraNoLeida = item.classList.contains('no-leida');

    if (eraNoLeida) {
        try {
            await marcarComoLeida(id, idUsuario);
            item.classList.remove('no-leida');
        } catch (error) {
            console.error('Error al marcar como leida:', error);
            mostrarError('No se pudo marcar esta notificación como leída.');
        }
    }

    const url = construirUrlDestino(item.dataset.tipo, item.dataset.tipoEntidad, item.dataset.idEntidad);
    if (url) window.location.href = url;
}

function iconoPorTipo(tipo) {
    const iconos = {
        TICKET_CREADO: 'bi-ticket-perforated',
        TICKET_ASIGNADO: 'bi-person-check',
        TICKET_RESUELTO: 'bi-check-circle',
        TICKET_ELIMINADO: 'bi-trash',
        TICKET_VENCIDO: 'bi-exclamation-triangle',
        TICKET_REASIGNADO: 'bi-arrow-left-right',
        COMENTARIO_CREADO: 'bi-chat',
        PROYECTO_CREADO: 'bi-kanban',
        FASE_CREADA: 'bi-diagram-3'
    };
    return iconos[tipo] || 'bi-bell';
}

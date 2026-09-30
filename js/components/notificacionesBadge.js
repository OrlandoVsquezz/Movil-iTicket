import { obtenerUsuarioLogueado } from '../utils/sesion.js';
import { contarNoLeidas } from '../services/notificacionesService.js';
import { iniciarAvisoNotificaciones } from './avisoNotificaciones.js';

document.addEventListener('DOMContentLoaded', () => {
    const usuario = obtenerUsuarioLogueado();
    if (!usuario?.idUsuario) return;

    //Se buscan y seleccionan los botones de notificacion a partir del elemento(badge) de aviso de notificación
    const campanas = Array.from(document.querySelectorAll('.notificacionAviso'))
        .map((punto) => punto.closest('.notificaciones, .notificaciones-no-individual'))
        .filter(Boolean);

    //Si hay notificaciones no leidas, el badge de notificación pendiente aparece
    if (campanas.length > 0) {
        contarNoLeidas(usuario.idUsuario)
            .then((cantidad) => {
                const hayNoLeidas = Number(cantidad) > 0;
                campanas.forEach((campana) => {
                    const punto = campana.querySelector('.notificacionAviso');
                    if (punto) punto.hidden = !hayNoLeidas;
                });
            })
            .catch((error) => console.error('Error al contar notificaciones no leidas:', error));
    }

    /* El mini aviso no depende de la campana: hay pantallas que no la tienen
       (vistaTicket, vistaProyecto, evaluacionPendiente) y ahí también debe salir
       cuando llega una notificación nueva. */
    iniciarAvisoNotificaciones(usuario.idUsuario);
});

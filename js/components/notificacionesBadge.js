import { obtenerUsuarioLogueado } from '../utils/sesion.js';
import { contarNoLeidas } from '../services/notificacionesService.js';

document.addEventListener('DOMContentLoaded', () => {
    //Se buscan y seleccionan los botones de notificacion a partir del elemento(badge) de aviso de notificación
    const campanas = Array.from(document.querySelectorAll('.notificacionAviso'))
        .map((punto) => punto.closest('.notificaciones, .notificaciones-no-individual'))
        .filter(Boolean);

    if (campanas.length === 0) return;

    //Navegacion hacia el html de otificaciones para los botones
    campanas.forEach((campana) => {
        if (campana.tagName === 'BUTTON') {
            campana.addEventListener('click', () => {
                window.location.href = 'notificaciones.html';
            });
        }
    });

    const usuario = obtenerUsuarioLogueado();
    if (!usuario?.idUsuario) return;

    //Si hay notificaciones no leidas, el badge de notificación pendiente aparece
    contarNoLeidas(usuario.idUsuario)
        .then((cantidad) => {
            const hayNoLeidas = Number(cantidad) > 0;
            campanas.forEach((campana) => {
                const punto = campana.querySelector('.notificacionAviso');
                if (punto) punto.hidden = !hayNoLeidas;
            });
        })
        .catch((error) => console.error('Error al contar notificaciones no leidas:', error));
});
